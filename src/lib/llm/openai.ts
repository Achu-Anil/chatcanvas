import OpenAI from "openai";
import type {
  LLMProvider,
  ChatRequestInput,
  ChatResponse,
  StreamChunk,
  Message,
} from "./types";
import { LLMAPIError, ChatSchema } from "./types";

/**
 * OpenAI LLM Provider
 * Implements chat completion with streaming support using Web Streams API
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI | null = null;
  private defaultModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.defaultModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
      });
    }
  }

  getName(): string {
    return "OpenAI";
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Convert our messages to OpenAI format
   */
  private formatMessages(
    system: string | undefined,
    messages: Message[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const formatted: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Add system message if provided
    if (system) {
      formatted.push({
        role: "system",
        content: system,
      });
    }

    // Add user/assistant messages
    for (const msg of messages) {
      formatted.push({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      });
    }

    return formatted;
  }

  /**
   * Non-streaming chat completion
   */
  async chat(requestInput: ChatRequestInput): Promise<ChatResponse> {
    if (!this.client) {
      throw new LLMAPIError(
        "OpenAI API key not configured. Set OPENAI_API_KEY environment variable.",
        this.getName()
      );
    }

    // Validate and apply defaults
    const request = ChatSchema.parse(requestInput);

    try {
      const response = await this.client.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: this.formatMessages(request.system, request.messages),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: false,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new LLMAPIError("No response from OpenAI", this.getName());
      }

      return {
        content: choice.message.content || "",
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: choice.finish_reason as ChatResponse["finishReason"],
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMAPIError(
          `OpenAI API error: ${error.message}`,
          this.getName(),
          error.status ?? undefined
        );
      }
      throw error;
    }
  }

  /**
   * Streaming chat completion using Web Streams API
   */
  chatStream(requestInput: ChatRequestInput): ReadableStream<StreamChunk> {
    if (!this.client) {
      throw new LLMAPIError(
        "OpenAI API key not configured. Set OPENAI_API_KEY environment variable.",
        this.getName()
      );
    }

    // Validate and apply defaults
    const request = ChatSchema.parse(requestInput);

    const client = this.client;
    const model = request.model || this.defaultModel;
    const messages = this.formatMessages(request.system, request.messages);
    const temperature = request.temperature;
    const maxTokens = request.maxTokens;

    return new ReadableStream<StreamChunk>({
      async start(controller) {
        try {
          const stream = await client.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true,
            stream_options: { include_usage: true },
          });

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            const finishReason = chunk.choices[0]?.finish_reason;

            // Send content chunks
            if (delta?.content) {
              controller.enqueue({
                content: delta.content,
                done: false,
                model: chunk.model,
              });
            }

            // Send final chunk with usage
            if (finishReason) {
              controller.enqueue({
                content: "",
                done: true,
                model: chunk.model,
                finishReason: finishReason as StreamChunk["finishReason"],
                usage: chunk.usage
                  ? {
                      promptTokens: chunk.usage.prompt_tokens,
                      completionTokens: chunk.usage.completion_tokens,
                      totalTokens: chunk.usage.total_tokens,
                    }
                  : undefined,
              });
            }
          }

          controller.close();
        } catch (error) {
          if (error instanceof OpenAI.APIError) {
            controller.error(
              new LLMAPIError(
                `OpenAI API error: ${error.message}`,
                "OpenAI",
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
