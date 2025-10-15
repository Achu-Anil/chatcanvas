import type {
  LLMProvider,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  Message,
} from "./types";
import { LLMAPIError } from "./types";

/**
 * Anthropic (Claude) LLM Provider
 *
 * TODO: Implement streaming with Server-Sent Events (SSE)
 * - Anthropic uses SSE format for streaming
 * - Need to parse SSE events and convert to StreamChunk format
 * - Use @anthropic-ai/sdk package when implementing
 * - Reference: https://docs.anthropic.com/claude/reference/streaming
 */
export class AnthropicProvider implements LLMProvider {
  private apiKey: string | null = null;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || null;
    this.defaultModel =
      process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  }

  getName(): string {
    return "Anthropic";
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  /**
   * Convert our messages to Anthropic format
   * Anthropic requires system message separate from messages array
   */
  private formatMessages(messages: Message[]): {
    role: "user" | "assistant";
    content: string;
  }[] {
    return messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
  }

  /**
   * Non-streaming chat completion
   *
   * TODO: Implement full Anthropic API integration
   * - Install @anthropic-ai/sdk: npm install @anthropic-ai/sdk
   * - Use Anthropic client for proper API calls
   * - Handle rate limiting and errors
   * - Map Anthropic response to our ChatResponse format
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async chat(_request: ChatRequest): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new LLMAPIError(
        "Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.",
        this.getName()
      );
    }

    // TODO: Replace with actual Anthropic SDK implementation
    // For now, throw an error to indicate it's not implemented
    throw new LLMAPIError(
      "Anthropic provider not yet fully implemented. Please use OpenAI provider or implement Anthropic integration.",
      this.getName()
    );

    /*
    // Placeholder for future implementation:
    
    import Anthropic from "@anthropic-ai/sdk";
    
    const client = new Anthropic({
      apiKey: this.apiKey,
    });
    
    const response = await client.messages.create({
      model: request.model || this.defaultModel,
      system: request.system,
      messages: this.formatMessages(request.messages),
      temperature: request.temperature,
      max_tokens: request.maxTokens || 4096,
    });
    
    return {
      content: response.content[0]?.text || "",
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason as ChatResponse["finishReason"],
    };
    */
  }

  /**
   * Streaming chat completion using Server-Sent Events (SSE)
   *
   * TODO: Implement SSE streaming for Anthropic
   *
   * Implementation steps:
   * 1. Install @anthropic-ai/sdk
   * 2. Create SSE stream from Anthropic
   * 3. Parse SSE events (content_block_start, content_block_delta, message_delta, etc.)
   * 4. Convert to our StreamChunk format
   * 5. Handle errors and completion
   *
   * Example structure:
   *
   * return new ReadableStream<StreamChunk>({
   *   async start(controller) {
   *     const stream = await client.messages.stream({
   *       model: request.model || this.defaultModel,
   *       system: request.system,
   *       messages: this.formatMessages(request.messages),
   *       temperature: request.temperature,
   *       max_tokens: request.maxTokens || 4096,
   *     });
   *
   *     for await (const event of stream) {
   *       if (event.type === "content_block_delta") {
   *         controller.enqueue({
   *           content: event.delta.text,
   *           done: false,
   *         });
   *       }
   *
   *       if (event.type === "message_stop") {
   *         controller.enqueue({
   *           content: "",
   *           done: true,
   *           usage: {
   *             promptTokens: event.message.usage.input_tokens,
   *             completionTokens: event.message.usage.output_tokens,
   *             totalTokens: event.message.usage.input_tokens + event.message.usage.output_tokens,
   *           },
   *         });
   *       }
   *     }
   *
   *     controller.close();
   *   }
   * });
   *
   * Reference: https://docs.anthropic.com/claude/reference/streaming
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  chatStream(_request: ChatRequest): ReadableStream<StreamChunk> {
    if (!this.apiKey) {
      throw new LLMAPIError(
        "Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.",
        this.getName()
      );
    }

    // TODO: Implement SSE streaming
    return new ReadableStream<StreamChunk>({
      start(controller) {
        controller.error(
          new LLMAPIError(
            "Anthropic streaming not yet implemented. TODO: Add SSE streaming support.",
            "Anthropic"
          )
        );
      },
    });
  }
}
