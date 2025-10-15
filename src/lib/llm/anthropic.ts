import Anthropic from "@anthropic-ai/sdk";
import type {
  LLMProvider,
  ChatRequestInput,
  ChatResponse,
  StreamChunk,
  Message,
  TokenUsage,
} from "./types";
import { LLMAPIError, ChatSchema } from "./types";

/**
 * Anthropic (Claude) LLM Provider
 *
 * Implements both streaming and non-streaming chat completions using the
 * Anthropic Messages API with Server-Sent Events (SSE) for streaming.
 */
export class AnthropicProvider implements LLMProvider {
  private apiKey: string | null = null;
  private defaultModel: string;
  private client: Anthropic | null = null;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || null;
    this.defaultModel =
      process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  getName(): string {
    return "Anthropic";
  }

  isConfigured(): boolean {
    return this.apiKey !== null && this.client !== null;
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
   */
  async chat(requestInput: ChatRequestInput): Promise<ChatResponse> {
    if (!this.client) {
      throw new LLMAPIError(
        "Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.",
        this.getName()
      );
    }

    // Validate and apply defaults
    const request = ChatSchema.parse(requestInput);

    try {
      const response = await this.client.messages.create({
        model: request.model || this.defaultModel,
        system: request.system,
        messages: this.formatMessages(request.messages),
        temperature: request.temperature,
        max_tokens: request.maxTokens || 4096,
      });

      // Extract text from content blocks
      const content = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as { type: "text"; text: string }).text)
        .join("");

      return {
        content,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: this.mapStopReason(response.stop_reason),
      };
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new LLMAPIError(
          error.message,
          this.getName(),
          error.status ?? undefined
        );
      }
      throw error;
    }
  }

  /**
   * Map Anthropic stop reason to our standard format
   */
  private mapStopReason(reason: string | null): ChatResponse["finishReason"] {
    if (!reason) return null;

    switch (reason) {
      case "end_turn":
        return "stop";
      case "max_tokens":
        return "length";
      case "stop_sequence":
        return "stop";
      default:
        return null;
    }
  }

  /**
   * Streaming chat completion using Server-Sent Events (SSE)
   *
   * Uses the Anthropic Messages API streaming with Next.js Edge-compatible
   * ReadableStream to provide real-time response chunks.
   */
  chatStream(requestInput: ChatRequestInput): ReadableStream<StreamChunk> {
    if (!this.client) {
      throw new LLMAPIError(
        "Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.",
        this.getName()
      );
    }

    // Validate and apply defaults
    const request = ChatSchema.parse(requestInput);

    const client = this.client;
    const model = request.model || this.defaultModel;
    const getName = this.getName.bind(this);
    const mapStopReason = this.mapStopReason.bind(this);

    return new ReadableStream<StreamChunk>({
      async start(controller) {
        try {
          // Create streaming request
          const stream = await client.messages.stream({
            model,
            system: request.system,
            messages: request.messages
              .filter((msg: Message) => msg.role !== "system")
              .map((msg: Message) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
              })),
            temperature: request.temperature,
            max_tokens: request.maxTokens || 4096,
          });

          let usage: TokenUsage | undefined;

          // Process SSE events
          for await (const event of stream) {
            // Content block delta - text chunks
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue({
                content: event.delta.text,
                done: false,
              });
            }

            // Message delta - contains usage updates
            if (event.type === "message_delta") {
              if (event.usage) {
                usage = {
                  promptTokens: 0, // Will be set in message_stop
                  completionTokens: event.usage.output_tokens,
                  totalTokens: event.usage.output_tokens,
                };
              }
            }

            // Message stop - final event with complete usage
            if (event.type === "message_stop") {
              const message = await stream.finalMessage();
              usage = {
                promptTokens: message.usage.input_tokens,
                completionTokens: message.usage.output_tokens,
                totalTokens:
                  message.usage.input_tokens + message.usage.output_tokens,
              };

              controller.enqueue({
                content: "",
                done: true,
                model: message.model,
                usage,
                finishReason: mapStopReason(message.stop_reason),
              });
            }
          }

          controller.close();
        } catch (error) {
          if (error instanceof Anthropic.APIError) {
            controller.error(
              new LLMAPIError(
                error.message,
                getName(),
                error.status ?? undefined
              )
            );
          } else {
            controller.error(error);
          }
        }
      },
    });
  }
}
