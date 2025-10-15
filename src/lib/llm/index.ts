import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import type {
  LLMProvider,
  ChatRequest,
  ChatResponse,
  StreamChunk,
} from "./types";
import { LLMProviderError, ChatSchema } from "./types";

// Re-export types and schemas
export { ChatSchema, MessageSchema, MessageRoleSchema } from "./types";
export type {
  ChatRequest,
  ChatResponse,
  StreamChunk,
  Message,
  MessageRole,
  TokenUsage,
  LLMProvider,
} from "./types";
export { LLMProviderError, LLMAPIError } from "./types";

/**
 * Available LLM providers
 */
export type ProviderType = "openai" | "anthropic";

/**
 * Get the configured LLM provider based on environment variables
 *
 * @returns Configured LLM provider instance
 * @throws LLMProviderError if provider is not configured or invalid
 */
export function getProvider(): LLMProvider {
  const providerType = (
    process.env.LLM_PROVIDER || "openai"
  ).toLowerCase() as ProviderType;

  let provider: LLMProvider;

  switch (providerType) {
    case "openai":
      provider = new OpenAIProvider();
      break;
    case "anthropic":
      provider = new AnthropicProvider();
      break;
    default:
      throw new LLMProviderError(
        `Invalid LLM_PROVIDER: ${providerType}. Must be one of: openai, anthropic`
      );
  }

  if (!provider.isConfigured()) {
    throw new LLMProviderError(
      `${provider.getName()} provider is not configured. Please set the required API key environment variable.`
    );
  }

  return provider;
}

/**
 * Get a specific provider by type
 *
 * @param type - Provider type to instantiate
 * @returns LLM provider instance (may not be configured)
 */
export function getProviderByType(type: ProviderType): LLMProvider {
  switch (type) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    default:
      throw new LLMProviderError(`Unknown provider type: ${type}`);
  }
}

/**
 * Generate a chat completion (non-streaming)
 * Uses the provider specified by LLM_PROVIDER env var (defaults to OpenAI)
 *
 * @param request - Chat request with messages, system prompt, etc.
 * @returns Chat response with content and usage information
 * @throws LLMProviderError if provider is not configured
 * @throws LLMAPIError if API call fails
 *
 * @example
 * ```typescript
 * const response = await chat({
 *   system: "You are a helpful assistant.",
 *   messages: [
 *     { role: "user", content: "Hello!" }
 *   ],
 *   temperature: 0.7,
 * });
 * console.log(response.content);
 * ```
 */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  // Validate request with Zod schema
  const validated = ChatSchema.parse(request);

  const provider = getProvider();
  return provider.chat(validated);
}

/**
 * Generate a chat completion with streaming
 * Uses the provider specified by LLM_PROVIDER env var (defaults to OpenAI)
 *
 * Returns a ReadableStream that yields chunks of the response as they arrive.
 * The final chunk will have `done: true` and include usage information.
 *
 * @param request - Chat request with messages, system prompt, etc.
 * @returns ReadableStream of response chunks
 * @throws LLMProviderError if provider is not configured
 * @throws LLMAPIError if API call fails
 *
 * @example
 * ```typescript
 * const stream = chatStream({
 *   system: "You are a helpful assistant.",
 *   messages: [
 *     { role: "user", content: "Tell me a story." }
 *   ],
 *   stream: true,
 * });
 *
 * const reader = stream.getReader();
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *
 *   if (value.done) {
 *     console.log("Usage:", value.usage);
 *   } else {
 *     process.stdout.write(value.content);
 *   }
 * }
 * ```
 */
export function chatStream(request: ChatRequest): ReadableStream<StreamChunk> {
  // Validate request with Zod schema
  const validated = ChatSchema.parse({ ...request, stream: true });

  const provider = getProvider();
  return provider.chatStream(validated);
}

/**
 * Check which providers are currently configured
 *
 * @returns Object with provider availability status
 *
 * @example
 * ```typescript
 * const status = getProviderStatus();
 * console.log("OpenAI:", status.openai);
 * console.log("Anthropic:", status.anthropic);
 * ```
 */
export function getProviderStatus(): Record<ProviderType, boolean> {
  return {
    openai: new OpenAIProvider().isConfigured(),
    anthropic: new AnthropicProvider().isConfigured(),
  };
}

/**
 * Get the name of the current provider
 *
 * @returns Provider name (e.g., "OpenAI")
 */
export function getCurrentProviderName(): string {
  return getProvider().getName();
}

/**
 * Helper to convert a ReadableStream to an async iterator
 * Useful for consuming streams with for-await-of
 *
 * @param stream - ReadableStream to convert
 * @returns AsyncIterable of stream chunks
 *
 * @example
 * ```typescript
 * const stream = chatStream({ messages: [...] });
 *
 * for await (const chunk of streamToAsyncIterable(stream)) {
 *   if (!chunk.done) {
 *     console.log(chunk.content);
 *   }
 * }
 * ```
 */
export async function* streamToAsyncIterable<T>(
  stream: ReadableStream<T>
): AsyncIterable<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Helper to collect all chunks from a stream into a single string
 * Useful when you want streaming benefits but need the full response
 *
 * @param stream - ReadableStream to collect from
 * @returns Object with full content and usage information
 *
 * @example
 * ```typescript
 * const stream = chatStream({ messages: [...] });
 * const result = await collectStream(stream);
 * console.log(result.content); // Full response
 * console.log(result.usage);   // Token usage
 * ```
 */
export async function collectStream(
  stream: ReadableStream<StreamChunk>
): Promise<{ content: string; usage?: StreamChunk["usage"]; model?: string }> {
  let content = "";
  let usage: StreamChunk["usage"];
  let model: string | undefined;

  for await (const chunk of streamToAsyncIterable(stream)) {
    if (chunk.done) {
      usage = chunk.usage;
      model = chunk.model;
    } else {
      content += chunk.content;
      if (chunk.model) {
        model = chunk.model;
      }
    }
  }

  return { content, usage, model };
}
