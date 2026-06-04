import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Email or Username is required").max(100),
  password: z.string().min(1, "Password is required").max(128),
});

export const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1).max(100000),
    })
  ),
  model: z.string().min(1),
  conversationId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
});

export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z.string().min(1).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z.string().min(1).optional(),
});

export const settingsSchema = z.object({
  apiKey: z.string().optional(),
  defaultModel: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  systemPrompt: z.string().max(10000).optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(100000),
});

export const importConversationSchema = z.object({
  title: z.string().min(1).max(200),
  model: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      createdAt: z.string().optional(),
    })
  ),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address").max(100),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Code must be exactly 6 digits").regex(/^\d+$/, "Code must contain only digits"),
});

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

