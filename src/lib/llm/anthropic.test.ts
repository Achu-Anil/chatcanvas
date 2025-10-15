import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AnthropicProvider } from "./anthropic";
import type { ChatRequestInput } from "./types";
import { LLMAPIError } from "./types";
import Anthropic from "@anthropic-ai/sdk";

// Mock Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn(() => ({
      messages: {
        create: vi.fn(),
        stream: vi.fn(),
      },
    })),
  };
});

describe("AnthropicProvider", () => {
  let provider: AnthropicProvider;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAnthropic: any;

  beforeEach(() => {
    // Set environment variables
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
    process.env.ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022";

    // Create provider and get mock instance
    provider = new AnthropicProvider();

    // Get the mocked Anthropic constructor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAnthropic = (vi.mocked(Anthropic) as any).mock.results[0].value;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_MODEL;
  });

  describe("Constructor and Configuration", () => {
    it("should initialize with API key from environment", () => {
      expect(provider.isConfigured()).toBe(true);
      expect(provider.getName()).toBe("Anthropic");
    });

    it("should not be configured without API key", () => {
      delete process.env.ANTHROPIC_API_KEY;
      const unconfiguredProvider = new AnthropicProvider();
      expect(unconfiguredProvider.isConfigured()).toBe(false);
    });

    it("should use default model from environment", () => {
      expect(provider.getName()).toBe("Anthropic");
    });
  });

  describe("Non-Streaming Chat", () => {
    it("should successfully complete a chat request", async () => {
      const mockResponse = {
        id: "msg_123",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello! How can I help you today?",
          },
        ],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
      };

      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const response = await provider.chat(request);

      expect(response).toEqual({
        content: "Hello! How can I help you today?",
        model: "claude-3-5-sonnet-20241022",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        finishReason: "stop",
      });

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
        model: "claude-3-5-sonnet-20241022",
        system: undefined,
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.7,
        max_tokens: 4096,
      });
    });

    it("should handle system messages correctly", async () => {
      const mockResponse = {
        content: [{ type: "text", text: "Response" }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 15,
          output_tokens: 5,
        },
      };

      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const request: ChatRequestInput = {
        system: "You are a helpful assistant.",
        messages: [{ role: "user", content: "Hello" }],
      };

      await provider.chat(request);

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
        model: "claude-3-5-sonnet-20241022",
        system: "You are a helpful assistant.",
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.7,
        max_tokens: 4096,
      });
    });

    it("should respect custom temperature and maxTokens", async () => {
      const mockResponse = {
        content: [{ type: "text", text: "Response" }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.3,
        maxTokens: 100,
      };

      await provider.chat(request);

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
        model: "claude-3-5-sonnet-20241022",
        system: undefined,
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.3,
        max_tokens: 100,
      });
    });

    it("should handle multiple content blocks", async () => {
      const mockResponse = {
        content: [
          { type: "text", text: "Part 1. " },
          { type: "text", text: "Part 2." },
        ],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        usage: { input_tokens: 10, output_tokens: 10 },
      };

      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const response = await provider.chat(request);

      expect(response.content).toBe("Part 1. Part 2.");
    });

    it("should map stop reasons correctly", async () => {
      const testCases = [
        { anthropic: "end_turn", expected: "stop" },
        { anthropic: "max_tokens", expected: "length" },
        { anthropic: "stop_sequence", expected: "stop" },
        { anthropic: null, expected: null },
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          content: [{ type: "text", text: "Response" }],
          model: "claude-3-5-sonnet-20241022",
          stop_reason: testCase.anthropic,
          usage: { input_tokens: 5, output_tokens: 5 },
        };

        mockAnthropic.messages.create.mockResolvedValue(mockResponse);

        const request: ChatRequestInput = {
          messages: [{ role: "user", content: "Hello" }],
        };

        const response = await provider.chat(request);
        expect(response.finishReason).toBe(testCase.expected);
      }
    });

    it("should throw LLMAPIError when API key is not configured", async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const unconfiguredProvider = new AnthropicProvider();

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
      };

      await expect(unconfiguredProvider.chat(request)).rejects.toThrow(
        LLMAPIError
      );
      await expect(unconfiguredProvider.chat(request)).rejects.toThrow(
        "Anthropic API key not configured"
      );
    });

    it("should handle API errors correctly", async () => {
      // Create a proper Anthropic.APIError mock
      class APIError extends Error {
        status: number;
        constructor(message: string, status: number) {
          super(message);
          this.name = "APIError";
          this.status = status;
        }
      }

      // Mock Anthropic.APIError for instanceof check
      Object.defineProperty(Anthropic, "APIError", {
        value: APIError,
        writable: true,
        configurable: true,
      });

      const apiError = new APIError("API Error", 429);
      mockAnthropic.messages.create.mockRejectedValue(apiError);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
      };

      await expect(provider.chat(request)).rejects.toThrow(LLMAPIError);
    });
  });

  describe("Streaming Chat", () => {
    it("should stream chat chunks correctly", async () => {
      const mockEvents = [
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Hello" },
        },
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: " there" },
        },
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "!" },
        },
        {
          type: "message_delta",
          delta: { stop_reason: "end_turn" },
          usage: { output_tokens: 3 },
        },
        {
          type: "message_stop",
        },
      ];

      const finalMessage = {
        model: "claude-3-5-sonnet-20241022",
        usage: {
          input_tokens: 10,
          output_tokens: 3,
        },
        stop_reason: "end_turn",
      };

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const event of mockEvents) {
            yield event;
          }
        },
        finalMessage: async () => finalMessage,
      };

      mockAnthropic.messages.stream.mockResolvedValue(mockStream);

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
      expect(chunks[0]).toEqual({ content: "Hello", done: false });
      expect(chunks[1]).toEqual({ content: " there", done: false });
      expect(chunks[2]).toEqual({ content: "!", done: false });
      expect(chunks[3]).toEqual({
        content: "",
        done: true,
        model: "claude-3-5-sonnet-20241022",
        usage: {
          promptTokens: 10,
          completionTokens: 3,
          totalTokens: 13,
        },
        finishReason: "stop",
      });
    });

    it("should handle non-text delta events", async () => {
      const mockEvents = [
        {
          type: "content_block_start",
          content_block: { type: "text", text: "" },
        },
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Text" },
        },
        {
          type: "message_stop",
        },
      ];

      const finalMessage = {
        model: "claude-3-5-sonnet-20241022",
        usage: { input_tokens: 5, output_tokens: 1 },
        stop_reason: "end_turn",
      };

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const event of mockEvents) {
            yield event;
          }
        },
        finalMessage: async () => finalMessage,
      };

      mockAnthropic.messages.stream.mockResolvedValue(mockStream);

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

      // Should have one text chunk and one done chunk
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual({ content: "Text", done: false });
      expect(chunks[1].done).toBe(true);
    });

    it("should throw error when not configured", () => {
      delete process.env.ANTHROPIC_API_KEY;
      const unconfiguredProvider = new AnthropicProvider();

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      expect(() => unconfiguredProvider.chatStream(request)).toThrow(
        LLMAPIError
      );
    });

    it("should handle streaming errors", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: "content_block_delta",
            delta: { type: "text_delta", text: "Start" },
          };
          throw new Error("Stream error");
        },
        finalMessage: async () => ({}),
      };

      mockAnthropic.messages.stream.mockResolvedValue(mockStream);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      const stream = provider.chatStream(request);
      const reader = stream.getReader();

      // Read first chunk successfully
      const firstChunk = await reader.read();
      expect(firstChunk.value).toEqual({ content: "Start", done: false });

      // Next read should throw
      await expect(reader.read()).rejects.toThrow();
    });

    it("should handle Anthropic API errors in stream", async () => {
      // Create a proper Anthropic.APIError mock
      class APIError extends Error {
        status: number;
        constructor(message: string, status: number) {
          super(message);
          this.name = "APIError";
          this.status = status;
        }
      }

      // Mock Anthropic.APIError for instanceof check
      Object.defineProperty(Anthropic, "APIError", {
        value: APIError,
        writable: true,
        configurable: true,
      });

      const apiError = new APIError("API Error", 429);
      mockAnthropic.messages.stream.mockRejectedValue(apiError);

      const request: ChatRequestInput = {
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      };

      const stream = provider.chatStream(request);
      const reader = stream.getReader();

      await expect(reader.read()).rejects.toThrow(LLMAPIError);
    });

    it("should filter out system messages from message array", async () => {
      const finalMessage = {
        model: "claude-3-5-sonnet-20241022",
        usage: { input_tokens: 10, output_tokens: 5 },
        stop_reason: "end_turn",
      };

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: "content_block_delta",
            delta: { type: "text_delta", text: "Response" },
          };
          yield { type: "message_stop" };
        },
        finalMessage: async () => finalMessage,
      };

      mockAnthropic.messages.stream.mockResolvedValue(mockStream);

      const request: ChatRequestInput = {
        system: "You are helpful",
        messages: [
          { role: "system", content: "System message" },
          { role: "user", content: "Hello" },
        ],
      };

      const stream = provider.chatStream(request);
      const reader = stream.getReader();

      // Consume stream
      while (!(await reader.read()).done) {
        // Just consume
      }

      // Verify system messages were filtered
      expect(mockAnthropic.messages.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          system: "You are helpful",
          messages: [{ role: "user", content: "Hello" }],
        })
      );
    });
  });
});
