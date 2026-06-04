"use client";

import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/ChatInput";
import { EmptyState } from "@/components/EmptyState";
import { useChatStore } from "@/stores/chatStore";
import { ExportMenu } from "@/components/ExportMenu";

export default function HomePage() {
  const router = useRouter();
  const {
    selectedModel,
    setCurrentConversationId,
    setMessages,
    addMessage,
    setIsStreaming,
    setStreamingContent,
    appendStreamingContent,
    setAbortController,
    setConversations,
    conversations,
  } = useChatStore();

  const handleSend = async (content: string) => {
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages([userMessage]);
    setIsStreaming(true);
    setStreamingContent("");

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content }],
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream");

      let fullContent = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6);

          try {
            const data = JSON.parse(dataStr);

            if (data.type === "conversation_id") {
              setCurrentConversationId(data.id);
              // Refresh conversations list
              const convRes = await fetch("/api/conversations");
              if (convRes.ok) {
                setConversations(await convRes.json());
              }
              router.push(`/chat/${data.id}`);
            } else if (data.type === "content") {
              fullContent += data.content;
              appendStreamingContent(data.content);
            } else if (data.type === "done") {
              addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content: fullContent,
                createdAt: new Date().toISOString(),
              });
              setStreamingContent("");
              break;
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        // User stopped generation
      } else {
        console.error("Chat error:", error);
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        appendStreamingContent(`\n\n⚠️ Error: ${errorMessage}`);
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2 className="chat-header-title">New Chat</h2>
        <ExportMenu />
      </div>
      <EmptyState onSend={handleSend} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
