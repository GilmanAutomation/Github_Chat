"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";

const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a Python function to reverse a linked list",
  "Compare React and Vue.js for a new project",
  "Help me write a professional email",
];

export function EmptyState({ onSend }: { onSend: (content: string) => void }) {
  const { selectedModel } = useChatStore();

  return (
    <div className="empty-state">
      <div className="empty-state-inner">
        <div className="empty-state-icon">
          <Sparkles size={48} strokeWidth={1.5} />
        </div>
        <h1 className="empty-state-title">GitHub Models Chat</h1>
        <p className="empty-state-subtitle">
          Start a conversation with any model. Currently using{" "}
          <span className="text-accent font-semibold">{selectedModel.split("/").pop()}</span>
        </p>

        <div className="suggestions-grid">
          {SUGGESTIONS.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSend(suggestion)}
              className="suggestion-card"
            >
              <span>{suggestion}</span>
              <ArrowRight size={14} className="suggestion-arrow" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
