import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { chatMessageSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";

const GITHUB_MODELS_ENDPOINT = "https://models.github.ai/inference";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success: rateLimitOk } = rateLimit(`chat:${user.userId}:${ip}`, 30, 60000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before sending more messages." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { messages, model, conversationId, temperature, maxTokens } = parsed.data;

    // Get user settings and API key
    const settings = await prisma.settings.findUnique({
      where: { userId: user.userId },
    });

    if (!settings?.apiKeyEncrypted || !settings?.apiKeyIv || !settings?.apiKeyTag) {
      return NextResponse.json(
        { error: "No API key configured. Please add your GitHub Models API key in Settings." },
        { status: 400 }
      );
    }

    const apiKey = decrypt(
      settings.apiKeyEncrypted,
      settings.apiKeyIv,
      settings.apiKeyTag
    );

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.substring(0, 100)
        : "New Chat";

      const conversation = await prisma.conversation.create({
        data: {
          userId: user.userId,
          title,
          model,
        },
      });
      convId = conversation.id;
    } else {
      // Update conversation model if changed
      await prisma.conversation.update({
        where: { id: convId },
        data: { model, updatedAt: new Date() },
      });
    }

    // Save user message if not already the last message in the database (e.g. after a retry/regenerate)
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === "user") {
      const lastDbMsg = await prisma.message.findFirst({
        where: { conversationId: convId },
        orderBy: { createdAt: "desc" },
      });

      if (lastDbMsg?.role === "user" && lastDbMsg.content === lastUserMsg.content) {
        // Skip duplicate user message saving
      } else {
        await prisma.message.create({
          data: {
            conversationId: convId,
            role: "user",
            content: lastUserMsg.content,
          },
        });
      }
    }

    // Build messages with system prompt
    const systemPrompt = settings.systemPrompt || "You are a helpful assistant.";
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Use native fetch to GitHub Models (OpenAI-compatible endpoint) for streaming.
    // Mimic the Azure SDK URL parameters and headers to ensure correct model routing (e.g. for DeepSeek and Grok) and bypass rate limit page blocks.
    const apiResponse = await fetch(`${GITHUB_MODELS_ENDPOINT}/chat/completions?api-version=2024-05-01-preview`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "user-agent": "azsdk-js-ai-inference-rest/1.0.0-beta.6 core-rest-pipeline/1.22.3 Node/24.11.1 (Windows_NT 10.0.26200; x64)",
        "api-key": apiKey,
        "authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: apiMessages,
        model,
        temperature: temperature ?? settings.temperature,
        max_tokens: maxTokens ?? settings.maxTokens,
        stream: true,
      }),
    });

    if (!apiResponse.ok) {
      if (apiResponse.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded on your GitHub account for this model. Please wait a few seconds and try again." },
          { status: 429 }
        );
      }
      const errText = await apiResponse.text();
      let errMsg = "Failed to get response from model";
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error?.message || errMsg;
      } catch {
        // use default
      }
      return NextResponse.json({ error: errMsg }, { status: apiResponse.status });
    }

    if (!apiResponse.body) {
      return NextResponse.json({ error: "No response body" }, { status: 502 });
    }

    // Stream the response
    const encoder = new TextEncoder();
    let fullContent = "";
    const apiReader = apiResponse.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let promptTokens = 0;
        let completionTokens = 0;
        let isSaved = false;

        const saveAssistantResponseAndUsage = async () => {
          if (isSaved || !fullContent) return;
          isSaved = true;

          // 1. Save assistant message
          await prisma.message.create({
            data: {
              conversationId: convId!,
              role: "assistant",
              content: fullContent,
            },
          });

          // 2. Auto-title on first exchange
          const msgCount = await prisma.message.count({
            where: { conversationId: convId! },
          });
          if (msgCount <= 2) {
            const title = lastUserMsg
              ? lastUserMsg.content.substring(0, 80)
              : "New Chat";
            await prisma.conversation.update({
              where: { id: convId! },
              data: { title },
            });
          }

          // 3. Fallback token estimation if usage is 0
          let finalPromptTokens = promptTokens;
          let finalCompletionTokens = completionTokens;
          if (finalPromptTokens === 0) {
            finalPromptTokens = Math.max(1, Math.round(apiMessages.map((m) => m.content).join(" ").length / 4));
          }
          if (finalCompletionTokens === 0) {
            finalCompletionTokens = Math.max(1, Math.round(fullContent.length / 4));
          }

          // 4. Save to model usage table
          await prisma.modelUsage.upsert({
            where: {
              userId_model: {
                userId: user.userId,
                model,
              },
            },
            create: {
              userId: user.userId,
              model,
              messagesSent: 1,
              inputTokens: finalPromptTokens,
              outputTokens: finalCompletionTokens,
            },
            update: {
              messagesSent: { increment: 1 },
              inputTokens: { increment: finalPromptTokens },
              outputTokens: { increment: finalCompletionTokens },
            },
          });
        };

        try {
          // Send conversation ID first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "conversation_id", id: convId })}\n\n`)
          );

          let buffer = "";

          while (true) {
            const { done, value } = await apiReader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;

              const dataStr = trimmed.slice(5).trim();
              if (dataStr === "[DONE]") {
                await saveAssistantResponseAndUsage();

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
                );
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(dataStr);
                
                // Track usage if present in chunk
                if (parsed.usage) {
                  promptTokens = parsed.usage.prompt_tokens || promptTokens;
                  completionTokens = parsed.usage.completion_tokens || completionTokens;
                }

                const delta = parsed.choices?.[0]?.delta;
                if (delta?.content) {
                  fullContent += delta.content;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "content", content: delta.content })}\n\n`
                    )
                  );
                }
              } catch {
                // Skip malformed JSON chunks
              }
            }
          }

          // Handle remaining buffer
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr !== "[DONE]") {
                try {
                  const parsed = JSON.parse(dataStr);
                  
                  // Track usage if present in chunk
                  if (parsed.usage) {
                    promptTokens = parsed.usage.prompt_tokens || promptTokens;
                    completionTokens = parsed.usage.completion_tokens || completionTokens;
                  }

                  const delta = parsed.choices?.[0]?.delta;
                  if (delta?.content) {
                    fullContent += delta.content;
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "content", content: delta.content })}\n\n`
                      )
                    );
                  }
                } catch {
                  // Skip
                }
              }
            }
          }

          await saveAssistantResponseAndUsage();

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: "Stream interrupted" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
