import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { streamText } from "ai";
import { saveChat } from "@/lib/chat";

// Mock dependencies
vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

vi.mock("@/lib/chat", () => ({
  saveChat: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn((model) => ({ provider: "openai", model })),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((model) => ({ provider: "anthropic", model })),
}));

describe("/api/chat route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.LLM_PROVIDER;
  });

  describe("POST", () => {
    it("should validate request body with Zod", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
      };

      vi.mocked(streamText).mockReturnValue(mockStreamResult as any);

      const response = await POST(req);

      expect(streamText).toHaveBeenCalled();
      expect(response).toBeInstanceOf(Response);
    });

    it("should return 400 if request body is invalid", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: 123, // Should be string
          messages: [],
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });

    it("should return 400 if last message is not from user", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi!" },
          ],
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Last message must be from user");
    });

    it("should use OpenAI as default provider", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
      };

      vi.mocked(streamText).mockReturnValue(mockStreamResult as any);

      await POST(req);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({ provider: "openai" }),
        })
      );
    });

    it("should use Anthropic when LLM_PROVIDER is set", async () => {
      process.env.LLM_PROVIDER = "anthropic";

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
      };

      vi.mocked(streamText).mockReturnValue(mockStreamResult as any);

      await POST(req);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({ provider: "anthropic" }),
        })
      );
    });

    it("should respect custom temperature and maxTokens", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [{ role: "user", content: "Hello" }],
          temperature: 0.5,
          maxTokens: 1000,
        }),
      });

      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
      };

      vi.mocked(streamText).mockReturnValue(mockStreamResult as any);

      await POST(req);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
          maxTokens: 1000,
        })
      );
    });

    it("should use default temperature (0.7) and maxTokens (2000)", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
      };

      vi.mocked(streamText).mockReturnValue(mockStreamResult as any);

      await POST(req);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
          maxTokens: 2000,
        })
      );
    });

    it("should include provider and model in response headers", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      const mockResponse = new Response("stream");
      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(mockResponse),
      };

      vi.mocked(streamText).mockReturnValue(mockStreamResult as any);

      await POST(req);

      expect(mockStreamResult.toDataStreamResponse).toHaveBeenCalledWith({
        headers: {
          "X-Provider": "openai",
          "X-Model": "gpt-4o-mini",
        },
      });
    });

    it("should call saveChat in onFinish callback", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          userId: "user-123",
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      let onFinishCallback: any;
      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
      };

      vi.mocked(streamText).mockImplementation((config: any) => {
        onFinishCallback = config.onFinish;
        return mockStreamResult as any;
      });

      await POST(req);

      // Simulate onFinish being called
      await onFinishCallback({
        text: "Hi there!",
        usage: { totalTokens: 50 },
        finishReason: "stop",
      });

      expect(saveChat).toHaveBeenCalledWith({
        chatId: "test-chat",
        userId: "user-123",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
        ],
      });
    });

    it("should handle saveChat errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      let onFinishCallback: any;
      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
      };

      vi.mocked(streamText).mockImplementation((config: any) => {
        onFinishCallback = config.onFinish;
        return mockStreamResult as any;
      });

      vi.mocked(saveChat).mockRejectedValue(new Error("Database error"));

      await POST(req);

      // Simulate onFinish being called
      await onFinishCallback({
        text: "Hi there!",
        usage: { totalTokens: 50 },
        finishReason: "stop",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save chat:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should return 500 for unexpected errors", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      vi.mocked(streamText).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");

      consoleSpy.mockRestore();
    });

    it("should accept optional userId", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          userId: "user-123",
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
      };

      vi.mocked(streamText).mockReturnValue(mockStreamResult as any);

      const response = await POST(req);

      expect(response).toBeInstanceOf(Response);
    });

    it("should accept system messages", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: "test-chat",
          messages: [
            { role: "system", content: "You are a helpful assistant" },
            { role: "user", content: "Hello" },
          ],
        }),
      });

      const mockStreamResult = {
        toDataStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
      };

      vi.mocked(streamText).mockReturnValue(mockStreamResult as any);

      await POST(req);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
          ]),
        })
      );
    });
  });
});
