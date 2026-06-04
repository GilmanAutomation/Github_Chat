import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  tokenCount?: number;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface ChatState {
  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  searchQuery: string;

  // Streaming
  isStreaming: boolean;
  streamingContent: string;
  abortController: AbortController | null;

  // UI
  sidebarOpen: boolean;
  selectedModel: string;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversationId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setSearchQuery: (query: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (content: string) => void;
  setAbortController: (controller: AbortController | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedModel: (model: string) => void;
  stopGeneration: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  searchQuery: "",
  isStreaming: false,
  streamingContent: "",
  abortController: null,
  sidebarOpen: true,
  selectedModel: "openai/gpt-4.1-mini",

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (content) =>
    set((state) => ({
      streamingContent: state.streamingContent + content,
    })),
  setAbortController: (controller) => set({ abortController: controller }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({
        isStreaming: false,
        abortController: null,
      });
    }
  },

  reset: () =>
    set({
      currentConversationId: null,
      messages: [],
      streamingContent: "",
      isStreaming: false,
      abortController: null,
    }),
}));
