"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessages } from "@/components/ChatMessages";
import { ExportMenu } from "@/components/ExportMenu";
import { useChatStore } from "@/stores/chatStore";
import { getModelDisplayName } from "@/config/models";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    messages,
    setMessages,
    addMessage,
    currentConversationId,
    setCurrentConversationId,
    selectedModel,
    setSelectedModel,
    isStreaming,
    setIsStreaming,
    streamingContent,
    setStreamingContent,
    appendStreamingContent,
    setAbortController,
    setConversations,
  } = useChatStore();

  useEffect(() => {
    loadConversation();
  }, [id]);

  const loadConversation = async () => {
    if (currentConversationId === id && isStreaming) {
      return;
    }

    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setCurrentConversationId(data.id);
      setSelectedModel(data.model);
      setMessages(
        data.messages.map((m: { id: string; role: string; content: string; createdAt: string; tokenCount?: number }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          tokenCount: m.tokenCount,
        }))
      );
    } catch {
      router.push("/");
    }
  };

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content,
        createdAt: new Date().toISOString(),
      };

      addMessage(userMessage);
      setIsStreaming(true);
      setStreamingContent("");

      const controller = new AbortController();
      setAbortController(controller);

      const allMessages = [
        ...messages
          .filter((m) => !(m.role === "assistant" && m.content.startsWith("⚠️ Error:")))
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages,
            model: selectedModel,
            conversationId: id,
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

              if (data.type === "content") {
                fullContent += data.content;
                appendStreamingContent(data.content);
              } else if (data.type === "done") {
                // Add assistant message to local state
                addMessage({
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: fullContent,
                  createdAt: new Date().toISOString(),
                });
                setStreamingContent("");
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        // Refresh conversation list for updated titles
        const convRes = await fetch("/api/conversations");
        if (convRes.ok) {
          setConversations(await convRes.json());
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          if (streamingContent) {
            addMessage({
              id: crypto.randomUUID(),
              role: "assistant",
              content: streamingContent + "\n\n*[Generation stopped]*",
              createdAt: new Date().toISOString(),
            });
            setStreamingContent("");
          }
        } else {
          console.error("Chat error:", error);
          const errorMessage = error instanceof Error ? error.message : "An error occurred";
          addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: `⚠️ Error: ${errorMessage}`,
            createdAt: new Date().toISOString(),
          });
        }
      } finally {
        setIsStreaming(false);
        setAbortController(null);
      }
    },
    [messages, selectedModel, id]
  );

  const handleRegenerate = useCallback(async () => {
    if (messages.length < 2) return;
    // Remove last assistant message and resend
    const withoutLast = messages.slice(0, -1);
    setMessages(withoutLast);

    const lastUserMsg = withoutLast.findLast((m) => m.role === "user");
    if (lastUserMsg) {
      // Remove the last user message too since sendMessage will re-add it
      setMessages(withoutLast.slice(0, -1));
      await sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  const handleEdit = useCallback(
    async (messageId: string, content: string) => {
      try {
        await fetch(`/api/conversations/${id}/messages`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, content }),
        });

        // Find message index and remove everything after it
        const msgIndex = messages.findIndex((m) => m.id === messageId);
        if (msgIndex >= 0) {
          const updatedMessages = messages.slice(0, msgIndex);
          setMessages(updatedMessages);
          await sendMessage(content);
        }
      } catch (error) {
        console.error("Edit failed:", error);
      }
    },
    [messages, id, sendMessage]
  );

  const conversationTitle = messages.length > 0
    ? messages[0].content.substring(0, 60)
    : "Chat";

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-header-info">
          <h2 className="chat-header-title">{conversationTitle}</h2>
          <span className="chat-header-model">
            {getModelDisplayName(selectedModel)}
          </span>
        </div>
        <ExportMenu />
      </div>

      {messages.length === 0 && !isStreaming ? (
        <div className="chat-loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading conversation...</span>
        </div>
      ) : (
        <ChatMessages onRegenerate={handleRegenerate} onEdit={handleEdit} />
      )}

      <ChatInput onSend={sendMessage} />
    </div>
  );
}
