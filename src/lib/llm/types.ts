import { z } from "zod";

/**
 * Message role types
 */
export const MessageRoleSchema = z.enum(["user", "assistant", "system"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

/**
 * Individual message schema
 */
export const MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

/**
 * Chat completion request schema
 */
export const ChatSchema = z.object({
  system: z.string().optional(),
  messages: z.array(MessageSchema).min(1, "At least one message is required"),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().positive().optional(),
  model: z.string().optional(),
});
export type ChatRequest = z.infer<typeof ChatSchema>;

/**
 * Chat request input (before Zod defaults are applied)
 */
export type ChatRequestInput = z.input<typeof ChatSchema>;

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Non-streaming response
 */
export interface ChatResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  finishReason: "stop" | "length" | "content_filter" | "tool_calls" | null;
}

/**
 * Streaming chunk
 */
export interface StreamChunk {
  content: string;
  done: boolean;
  model?: string;
  usage?: TokenUsage;
  finishReason?: "stop" | "length" | "content_filter" | "tool_calls" | null;
}

/**
 * LLM Provider interface
 */
export interface LLMProvider {
  /**
   * Generate a chat completion (non-streaming)
   */
  chat(request: ChatRequestInput): Promise<ChatResponse>;

  /**
   * Generate a chat completion with streaming
   */
  chatStream(request: ChatRequestInput): ReadableStream<StreamChunk>;

  /**
   * Get the provider name
   */
  getName(): string;

  /**
   * Check if the provider is configured
   */
  isConfigured(): boolean;
}

/**
 * LLM Provider factory error
 */
export class LLMProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMProviderError";
  }
}

/**
 * LLM API error
 */
export class LLMAPIError extends Error {
  public statusCode?: number;
  public provider: string;

  constructor(message: string, provider: string, statusCode?: number) {
    super(message);
    this.name = "LLMAPIError";
    this.provider = provider;
    this.statusCode = statusCode;
  }
}
