"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useChatStore, Conversation } from "@/stores/chatStore";
import { UserMenu } from "./UserMenu";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    conversations,
    setConversations,
    currentConversationId,
    setCurrentConversationId,
    setMessages,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    setSidebarOpen,
    reset,
  } = useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/conversations?search=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchConversations, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleNewChat = () => {
    reset();
    router.push("/");
  };

  const handleSelectConversation = (conv: Conversation) => {
    if (currentConversationId !== conv.id) {
      setMessages([]);
    }
    setCurrentConversationId(conv.id);
    router.push(`/chat/${conv.id}`);
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
      setEditingId(null);
      fetchConversations();
    } catch (error) {
      console.error("Failed to rename:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (currentConversationId === id) {
        reset();
        router.push("/");
      }
      fetchConversations();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  if (!sidebarOpen) {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        className="sidebar-toggle-closed"
        title="Open sidebar"
      >
        <PanelLeft size={20} />
      </button>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Chats</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="sidebar-close-btn"
          title="Close sidebar"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      <button onClick={handleNewChat} className="new-chat-btn">
        <Plus size={18} />
        <span>New Chat</span>
      </button>

      <div className="sidebar-search">
        <Search size={16} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sidebar-search-input"
        />
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="conversation-empty">
            <MessageSquare size={24} className="opacity-30" />
            <span>No conversations yet</span>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = currentConversationId === conv.id || pathname === `/chat/${conv.id}`;

            return (
              <div
                key={conv.id}
                className={`conversation-item ${isActive ? "active" : ""}`}
              >
                {editingId === conv.id ? (
                  <div className="conversation-edit">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(conv.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="conversation-edit-input"
                      autoFocus
                    />
                    <button onClick={() => handleRename(conv.id)} className="icon-btn">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="icon-btn">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleSelectConversation(conv)}
                      className="conversation-btn"
                    >
                      <MessageSquare size={16} />
                      <span className="conversation-title">{conv.title}</span>
                    </button>
                    <div className="conversation-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(conv.id);
                          setEditTitle(conv.title);
                        }}
                        className="icon-btn"
                        title="Rename"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conv.id);
                        }}
                        className="icon-btn danger"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <UserMenu />
    </aside>
  );
}
