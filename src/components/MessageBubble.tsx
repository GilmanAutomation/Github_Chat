"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Copy,
  Check,
  User,
  Bot,
  RotateCcw,
  Pencil,
  Clock,
} from "lucide-react";
import type { Message } from "@/stores/chatStore";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  onRegenerate?: () => void;
  onEdit?: (content: string) => void;
}

export function MessageBubble({
  message,
  isLast,
  isStreaming,
  onRegenerate,
  onEdit,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const timestamp = useMemo(() => {
    const date = new Date(message.createdAt);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [message.createdAt]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    if (editing && editContent !== message.content) {
      onEdit?.(editContent);
    }
    setEditing(!editing);
  };

  const isUser = message.role === "user";

  return (
    <div className={`message ${isUser ? "message-user" : "message-assistant"}`}>
      <div className="message-avatar">
        {isUser ? (
          <div className="avatar avatar-user">
            <User size={18} />
          </div>
        ) : (
          <div className="avatar avatar-assistant">
            <Bot size={18} />
          </div>
        )}
      </div>

      <div className="message-content-wrapper">
        <div className="message-header">
          <span className="message-role">{isUser ? "You" : "Assistant"}</span>
          <span className="message-time">
            <Clock size={12} />
            {timestamp}
          </span>
        </div>

        <div className="message-body">
          {editing ? (
            <div className="message-edit">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="message-edit-input"
                autoFocus
              />
              <div className="message-edit-actions">
                <button onClick={handleEdit} className="btn btn-sm btn-primary">
                  Save & Submit
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditContent(message.content);
                  }}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match;

                    if (isInline) {
                      return (
                        <code className="inline-code" {...props}>
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="code-block">
                        <div className="code-block-header">
                          <span className="code-lang">{match[1]}</span>
                          <CodeCopyButton
                            code={String(children).replace(/\n$/, "")}
                          />
                        </div>
                        <pre>
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && isLast && !isUser && (
                <span className="streaming-cursor" />
              )}
            </div>
          )}
        </div>

        {!editing && !isStreaming && (
          <div className="message-actions">
            <button
              onClick={handleCopy}
              className="message-action-btn"
              title="Copy message"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            {isUser && onEdit && (
              <button
                onClick={() => setEditing(true)}
                className="message-action-btn"
                title="Edit message"
              >
                <Pencil size={14} />
              </button>
            )}
            {!isUser && isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="message-action-btn"
                title="Regenerate response"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="code-copy-btn" title="Copy code">
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
