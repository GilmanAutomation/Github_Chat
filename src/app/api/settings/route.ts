import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/encryption";
import { settingsSchema } from "@/lib/validation";
import { createGitHubModelsClient } from "@/lib/githubModels";
import { isUnexpected } from "@azure-rest/ai-inference";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: user.userId },
    });

    if (!settings) {
      return NextResponse.json({
        defaultModel: "openai/gpt-4.1-mini",
        temperature: 0.7,
        maxTokens: 4096,
        theme: "system",
        systemPrompt: "You are a helpful assistant.",
        hasApiKey: false,
      });
    }

    return NextResponse.json({
      defaultModel: settings.defaultModel,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      theme: settings.theme,
      systemPrompt: settings.systemPrompt,
      hasApiKey: !!settings.apiKeyEncrypted,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.defaultModel !== undefined) updateData.defaultModel = data.defaultModel;
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.maxTokens !== undefined) updateData.maxTokens = data.maxTokens;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt;

    if (data.apiKey !== undefined && data.apiKey !== "") {
      const { encrypted, iv, tag } = encrypt(data.apiKey);
      updateData.apiKeyEncrypted = encrypted;
      updateData.apiKeyIv = iv;
      updateData.apiKeyTag = tag;
    }

    const settings = await prisma.settings.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      defaultModel: settings.defaultModel,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      theme: settings.theme,
      systemPrompt: settings.systemPrompt,
      hasApiKey: !!settings.apiKeyEncrypted,
    });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.settings.update({
      where: { userId: user.userId },
      data: {
        apiKeyEncrypted: null,
        apiKeyIv: null,
        apiKeyTag: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
