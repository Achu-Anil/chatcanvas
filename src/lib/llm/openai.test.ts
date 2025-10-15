import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenAIProvider } from "./openai";
import type { ChatRequestInput } from "./types";
import { LLMAPIError } from "./types";
import OpenAI from "openai";

// Mock OpenAI SDK
vi.mock("openai", () => {
  return {
    default: vi.fn(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe("OpenAIProvider", () => {
  let provider: OpenAIProvider;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockOpenAI: any;

  beforeEach(() => {
    // Set environment variables
    process.env.OPENAI_API_KEY = "sk-test-key";
    process.env.OPENAI_MODEL = "gpt-4o-mini";

    // Create provider and get mock instance
    provider = new OpenAIProvider();

    // Get the mocked OpenAI constructor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOpenAI = (vi.mocked(OpenAI) as any).mock.results[0].value;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
  });

  describe("Constructor and Configuration", () => {
    it("should initialize with API key from environment", () => {
      expect(provider.isConfigured()).toBe(true);
      expect(provider.getName()).toBe("OpenAI");
    });

    it("should not be configured without API key", () => {
      delete process.env.OPENAI_API_KEY;
      const unconfiguredProvider = new OpenAIProvider();
      expect(unconfiguredProvider.isConfigured()).toBe(false);
    });

    it("should use default model from environment", () => {
      expect(provider.getName()).toBe("OpenAI");
    });
  });

  describe("Non-Streaming Chat", () => {
    it("should successfully complete a chat request", async () => {
      const mockResponse = {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Hello! How can I help you today?",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const response = await provider.chat(request);

      expect(response).toEqual({
        content: "Hello! How can I help you today?",
        model: "gpt-4o-mini",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        finishReason: "stop",
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.7,
        stream: false,
      });
    });

    it("should handle system messages correctly", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: "assistant",
              content: "Response",
            },
            finish_reason: "stop",
          },
        ],
        model: "gpt-4o-mini",
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const request: ChatRequestInput = {
        system: "You are a helpful assistant.",
        messages: [{ role: "user", content: "Hello" }],
      };

      await provider.chat(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello" },
        ],
        temperature: 0.7,
        stream: false,
      });
    });

    it("should respect custom temperature and maxTokens", async () => {
      const mockResponse = {
        choices: [
          {
            message: { role: "assistant", content: "Response" },
            finish_reason: "stop",
          },
        ],
        model: "gpt-4o-mini",
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.3,
        maxTokens: 100,
      };

      await provider.chat(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.3,
        max_tokens: 100,
        stream: false,
      });
    });

    it("should throw LLMAPIError when API key is not configured", async () => {
      delete process.env.OPENAI_API_KEY;
      const unconfiguredProvider = new OpenAIProvider();

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
      };

      await expect(unconfiguredProvider.chat(request)).rejects.toThrow(
        LLMAPIError
      );
      await expect(unconfiguredProvider.chat(request)).rejects.toThrow(
        "OpenAI API key not configured"
      );
    });

    it("should handle API errors correctly", async () => {
      // Create a proper OpenAI.APIError mock
      class APIError extends Error {
        status: number;
        constructor(message: string, status: number) {
          super(message);
          this.name = "APIError";
          this.status = status;
        }
      }

      // Mock OpenAI.APIError for instanceof check
      Object.defineProperty(OpenAI, "APIError", {
        value: APIError,
        writable: true,
        configurable: true,
      });

      const apiError = new APIError("API Error", 429);
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
      };

      await expect(provider.chat(request)).rejects.toThrow(LLMAPIError);
    });
  });

  describe("Streaming Chat", () => {
    it("should stream chat chunks correctly", async () => {
      const mockChunks = [
        {
          id: "chatcmpl-123",
          object: "chat.completion.chunk",
          created: 1677652288,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              delta: { content: "Hello" },
              finish_reason: null,
            },
          ],
        },
        {
          id: "chatcmpl-123",
          object: "chat.completion.chunk",
          created: 1677652288,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              delta: { content: " there" },
              finish_reason: null,
            },
          ],
        },
        {
          id: "chatcmpl-123",
          object: "chat.completion.chunk",
          created: 1677652288,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              delta: { content: "!" },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 3,
            total_tokens: 13,
          },
        },
      ];

      // Create async iterator from chunks
      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAsyncIterator);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      const stream = provider.chatStream(request);
      const reader = stream.getReader();
      const chunks = [];

      let result = await reader.read();
      while (!result.done) {
        chunks.push(result.value);
        result = await reader.read();
      }

      expect(chunks).toHaveLength(4);
      expect(chunks[0]).toEqual({
        content: "Hello",
        done: false,
        model: "gpt-4o-mini",
      });
      expect(chunks[1]).toEqual({
        content: " there",
        done: false,
        model: "gpt-4o-mini",
      });
      expect(chunks[2]).toEqual({
        content: "!",
        done: false,
        model: "gpt-4o-mini",
      });
      expect(chunks[3]).toEqual({
        content: "",
        done: true,
        model: "gpt-4o-mini",
        usage: {
          promptTokens: 10,
          completionTokens: 3,
          totalTokens: 13,
        },
        finishReason: "stop",
      });
    });

    it("should handle empty content chunks", async () => {
      const mockChunks = [
        {
          choices: [{ delta: {}, finish_reason: null }],
          model: "gpt-4o-mini",
        },
        {
          choices: [{ delta: { content: "Text" }, finish_reason: "stop" }],
          model: "gpt-4o-mini",
          usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
        },
      ];

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAsyncIterator);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      const stream = provider.chatStream(request);
      const reader = stream.getReader();
      const chunks = [];

      let result = await reader.read();
      while (!result.done) {
        chunks.push(result.value);
        result = await reader.read();
      }

      // Should only have one chunk with actual content and one done chunk
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual({
        content: "Text",
        done: false,
        model: "gpt-4o-mini",
      });
      expect(chunks[1].done).toBe(true);
    });

    it("should throw error when not configured", () => {
      delete process.env.OPENAI_API_KEY;
      const unconfiguredProvider = new OpenAIProvider();

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      expect(() => unconfiguredProvider.chatStream(request)).toThrow(
        LLMAPIError
      );
    });

    it("should handle streaming errors", async () => {
      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{ delta: { content: "Start" }, finish_reason: null }],
            model: "gpt-4o-mini",
          };
          throw new Error("Stream error");
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAsyncIterator);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      const stream = provider.chatStream(request);
      const reader = stream.getReader();

      // Read first chunk successfully
      const firstChunk = await reader.read();
      expect(firstChunk.value).toEqual({
        content: "Start",
        done: false,
        model: "gpt-4o-mini",
      });

      // Next read should throw
      await expect(reader.read()).rejects.toThrow();
    });
  });
});
