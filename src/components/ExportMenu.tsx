"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileJson, FileText, Copy, Upload, Check } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";

export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { currentConversationId, messages } = useChatStore();
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: "json" | "markdown") => {
    if (!currentConversationId) return;
    try {
      const res = await fetch(
        `/api/conversations/${currentConversationId}/export?format=${format}`
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat.${format === "markdown" ? "md" : "json"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
    setOpen(false);
  };

  const handleCopyAll = async () => {
    const text = messages
      .map((m) => `**${m.role === "user" ? "You" : "Assistant"}:**\n${m.content}`)
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/conversations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const conv = await res.json();
        window.location.href = `/chat/${conv.id}`;
      }
    } catch (error) {
      console.error("Import failed:", error);
    }
    setOpen(false);
  };

  return (
    <div className="export-menu" ref={ref}>
      <button onClick={() => setOpen(!open)} className="export-menu-btn" title="Export / Import">
        <Download size={18} />
      </button>

      {open && (
        <div className="export-menu-dropdown">
          <button
            onClick={() => handleExport("markdown")}
            className="export-menu-item"
            disabled={!currentConversationId}
          >
            <FileText size={16} />
            <span>Export as Markdown</span>
          </button>
          <button
            onClick={() => handleExport("json")}
            className="export-menu-item"
            disabled={!currentConversationId}
          >
            <FileJson size={16} />
            <span>Export as JSON</span>
          </button>
          <button onClick={handleCopyAll} className="export-menu-item" disabled={messages.length === 0}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Copied!" : "Copy conversation"}</span>
          </button>
          <div className="export-menu-divider" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="export-menu-item"
          >
            <Upload size={16} />
            <span>Import conversation</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
