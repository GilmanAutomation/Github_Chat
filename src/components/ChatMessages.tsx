"use client";

import { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { useChatStore, Message } from "@/stores/chatStore";

interface ChatMessagesProps {
  onRegenerate: () => void;
  onEdit: (messageId: string, content: string) => void;
}

export function ChatMessages({ onRegenerate, onEdit }: ChatMessagesProps) {
  const { messages, isStreaming, streamingContent } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const allMessages: Message[] = [
    ...messages,
    ...(isStreaming && streamingContent
      ? [
          {
            id: "streaming",
            role: "assistant" as const,
            content: streamingContent,
            createdAt: new Date().toISOString(),
          },
        ]
      : []),
  ];

  return (
    <div className="chat-messages" ref={containerRef}>
      <div className="chat-messages-inner">
        {allMessages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLast={index === allMessages.length - 1}
            isStreaming={isStreaming && message.id === "streaming"}
            onRegenerate={
              message.role === "assistant" &&
              index === allMessages.length - 1 &&
              !isStreaming
                ? onRegenerate
                : undefined
            }
            onEdit={
              message.role === "user" && !isStreaming
                ? (content) => onEdit(message.id, content)
                : undefined
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
