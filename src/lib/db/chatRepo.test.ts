import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getOrCreateChat,
  appendMessage,
  computeTokenTotals,
  getChatById,
  deleteChat,
  getChatsByUserId,
  ChatNotFoundError,
  InvalidMessageRoleError,
  type ChatWithMessages,
  type MessageRole,
} from "./chatRepo";
import { prisma } from "./prisma";
import type { Chat, Message } from "@prisma/client";

// Mock Prisma client
vi.mock("./prisma", () => ({
  prisma: {
    chat: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
  },
}));

describe("chatRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateChat", () => {
    describe("Happy Paths", () => {
      it("should create a new chat when no chatId is provided", async () => {
        const mockChat: ChatWithMessages = {
          id: "new-chat-id",
          userId: "user-123",
          title: "New Chat",
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        };

        vi.mocked(prisma.chat.create).mockResolvedValue(mockChat);

        const result = await getOrCreateChat(undefined, "user-123", "New Chat");

        expect(result).toEqual(mockChat);
        expect(prisma.chat.create).toHaveBeenCalledWith({
          data: {
            userId: "user-123",
            title: "New Chat",
          },
          include: {
            messages: true,
          },
        });
      });

      it("should create a new chat without userId or title", async () => {
        const mockChat: ChatWithMessages = {
          id: "new-chat-id",
          userId: null,
          title: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        };

        vi.mocked(prisma.chat.create).mockResolvedValue(mockChat);

        const result = await getOrCreateChat();

        expect(result).toEqual(mockChat);
        expect(prisma.chat.create).toHaveBeenCalledWith({
          data: {
            userId: undefined,
            title: undefined,
          },
          include: {
            messages: true,
          },
        });
      });

      it("should get an existing chat when chatId is provided", async () => {
        const mockMessages: Message[] = [
          {
            id: "msg-1",
            chatId: "chat-123",
            role: "user",
            content: "Hello",
            tokens: 5,
            createdAt: new Date(),
          },
          {
            id: "msg-2",
            chatId: "chat-123",
            role: "assistant",
            content: "Hi there!",
            tokens: 10,
            createdAt: new Date(),
          },
        ];

        const mockChat: ChatWithMessages = {
          id: "chat-123",
          userId: "user-123",
          title: "Existing Chat",
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: mockMessages,
        };

        vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat);

        const result = await getOrCreateChat("chat-123");

        expect(result).toEqual(mockChat);
        expect(prisma.chat.findUnique).toHaveBeenCalledWith({
          where: { id: "chat-123" },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        });
      });
    });

    describe("Error Paths", () => {
      it("should throw ChatNotFoundError when chatId doesn't exist", async () => {
        vi.mocked(prisma.chat.findUnique).mockResolvedValue(null);

        await expect(getOrCreateChat("non-existent-chat")).rejects.toThrow(
          ChatNotFoundError
        );
        await expect(getOrCreateChat("non-existent-chat")).rejects.toThrow(
          "Chat with id non-existent-chat not found"
        );
      });
    });
  });

  describe("appendMessage", () => {
    describe("Happy Paths", () => {
      it("should append a user message to a chat", async () => {
        const mockMessage: Message = {
          id: "msg-1",
          chatId: "chat-123",
          role: "user",
          content: "Hello, AI!",
          tokens: 15,
          createdAt: new Date(),
        };

        vi.mocked(prisma.chat.findUnique).mockResolvedValue({
          id: "chat-123",
        } as Chat);
        vi.mocked(prisma.message.create).mockResolvedValue(mockMessage);
        vi.mocked(prisma.chat.update).mockResolvedValue({} as Chat);

        const result = await appendMessage("chat-123", {
          role: "user",
          content: "Hello, AI!",
          tokens: 15,
        });

        expect(result).toEqual(mockMessage);
        expect(prisma.message.create).toHaveBeenCalledWith({
          data: {
            chatId: "chat-123",
            role: "user",
            content: "Hello, AI!",
            tokens: 15,
          },
        });
        expect(prisma.chat.update).toHaveBeenCalledWith({
          where: { id: "chat-123" },
          data: { updatedAt: expect.any(Date) },
        });
      });

      it("should append an assistant message without tokens", async () => {
        const mockMessage: Message = {
          id: "msg-2",
          chatId: "chat-123",
          role: "assistant",
          content: "Hello, human!",
          tokens: null,
          createdAt: new Date(),
        };

        vi.mocked(prisma.chat.findUnique).mockResolvedValue({
          id: "chat-123",
        } as Chat);
        vi.mocked(prisma.message.create).mockResolvedValue(mockMessage);
        vi.mocked(prisma.chat.update).mockResolvedValue({} as Chat);

        const result = await appendMessage("chat-123", {
          role: "assistant",
          content: "Hello, human!",
        });

        expect(result).toEqual(mockMessage);
        expect(prisma.message.create).toHaveBeenCalledWith({
          data: {
            chatId: "chat-123",
            role: "assistant",
            content: "Hello, human!",
            tokens: undefined,
          },
        });
      });

      it("should append a system message", async () => {
        const mockMessage: Message = {
          id: "msg-3",
          chatId: "chat-123",
          role: "system",
          content: "You are a helpful assistant.",
          tokens: 20,
          createdAt: new Date(),
        };

        vi.mocked(prisma.chat.findUnique).mockResolvedValue({
          id: "chat-123",
        } as Chat);
        vi.mocked(prisma.message.create).mockResolvedValue(mockMessage);
        vi.mocked(prisma.chat.update).mockResolvedValue({} as Chat);

        const result = await appendMessage("chat-123", {
          role: "system",
          content: "You are a helpful assistant.",
          tokens: 20,
        });

        expect(result).toEqual(mockMessage);
      });
    });

    describe("Error Paths", () => {
      it("should throw ChatNotFoundError when chat doesn't exist", async () => {
        vi.mocked(prisma.chat.findUnique).mockResolvedValue(null);

        await expect(
          appendMessage("non-existent-chat", {
            role: "user",
            content: "Hello",
          })
        ).rejects.toThrow(ChatNotFoundError);
      });

      it("should throw InvalidMessageRoleError for invalid role", async () => {
        vi.mocked(prisma.chat.findUnique).mockResolvedValue({
          id: "chat-123",
        } as Chat);

        await expect(
          appendMessage("chat-123", {
            role: "invalid-role" as MessageRole,
            content: "Hello",
          })
        ).rejects.toThrow(InvalidMessageRoleError);

        await expect(
          appendMessage("chat-123", {
            role: "admin" as MessageRole,
            content: "Hello",
          })
        ).rejects.toThrow("Invalid message role: admin");
      });
    });
  });

  describe("computeTokenTotals", () => {
    describe("Happy Paths", () => {
      it("should compute token totals for a chat with multiple messages", async () => {
        const mockChat = {
          id: "chat-123",
          messages: [
            { role: "user", tokens: 10 },
            { role: "assistant", tokens: 20 },
            { role: "user", tokens: 15 },
            { role: "assistant", tokens: 25 },
            { role: "system", tokens: 5 },
          ],
        };

        vi.mocked(prisma.chat.findUnique).mockResolvedValue(
          mockChat as unknown as Chat & { messages: Message[] }
        );

        const result = await computeTokenTotals("chat-123");

        expect(result).toEqual({
          userTokens: 25,
          assistantTokens: 45,
          systemTokens: 5,
          totalTokens: 75,
        });
      });

      it("should handle chat with no messages", async () => {
        const mockChat = {
          id: "chat-123",
          messages: [],
        };

        vi.mocked(prisma.chat.findUnique).mockResolvedValue(
          mockChat as unknown as Chat & { messages: Message[] }
        );

        const result = await computeTokenTotals("chat-123");

        expect(result).toEqual({
          userTokens: 0,
          assistantTokens: 0,
          systemTokens: 0,
          totalTokens: 0,
        });
      });

      it("should handle messages with null tokens", async () => {
        const mockChat = {
          id: "chat-123",
          messages: [
            { role: "user", tokens: 10 },
            { role: "assistant", tokens: null },
            { role: "user", tokens: null },
            { role: "system", tokens: 5 },
          ],
        };

        vi.mocked(prisma.chat.findUnique).mockResolvedValue(
          mockChat as unknown as Chat & { messages: Message[] }
        );

        const result = await computeTokenTotals("chat-123");

        expect(result).toEqual({
          userTokens: 10,
          assistantTokens: 0,
          systemTokens: 5,
          totalTokens: 15,
        });
      });

      it("should handle chat with only one role", async () => {
        const mockChat = {
          id: "chat-123",
          messages: [
            { role: "user", tokens: 10 },
            { role: "user", tokens: 15 },
            { role: "user", tokens: 20 },
          ],
        };

        vi.mocked(prisma.chat.findUnique).mockResolvedValue(
          mockChat as unknown as Chat & { messages: Message[] }
        );

        const result = await computeTokenTotals("chat-123");

        expect(result).toEqual({
          userTokens: 45,
          assistantTokens: 0,
          systemTokens: 0,
          totalTokens: 45,
        });
      });
    });

    describe("Error Paths", () => {
      it("should throw ChatNotFoundError when chat doesn't exist", async () => {
        vi.mocked(prisma.chat.findUnique).mockResolvedValue(null);

        await expect(computeTokenTotals("non-existent-chat")).rejects.toThrow(
          ChatNotFoundError
        );
        await expect(computeTokenTotals("non-existent-chat")).rejects.toThrow(
          "Chat with id non-existent-chat not found"
        );
      });
    });
  });

  describe("getChatById", () => {
    it("should return chat with messages when found", async () => {
      const mockChat: ChatWithMessages = {
        id: "chat-123",
        userId: "user-123",
        title: "Test Chat",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: "msg-1",
            chatId: "chat-123",
            role: "user",
            content: "Hello",
            tokens: 5,
            createdAt: new Date(),
          },
        ],
      };

      vi.mocked(prisma.chat.findUnique).mockResolvedValue(mockChat);

      const result = await getChatById("chat-123");

      expect(result).toEqual(mockChat);
    });

    it("should return null when chat not found", async () => {
      vi.mocked(prisma.chat.findUnique).mockResolvedValue(null);

      const result = await getChatById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("deleteChat", () => {
    it("should delete a chat successfully", async () => {
      const mockChat: Chat = {
        id: "chat-123",
        userId: "user-123",
        title: "Test Chat",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chat.delete).mockResolvedValue(mockChat);

      const result = await deleteChat("chat-123");

      expect(result).toEqual(mockChat);
      expect(prisma.chat.delete).toHaveBeenCalledWith({
        where: { id: "chat-123" },
      });
    });

    it("should throw ChatNotFoundError when chat doesn't exist", async () => {
      vi.mocked(prisma.chat.delete).mockRejectedValue(new Error("Not found"));

      await expect(deleteChat("non-existent-chat")).rejects.toThrow(
        ChatNotFoundError
      );
    });
  });

  describe("getChatsByUserId", () => {
    it("should return chats for a user with default limit", async () => {
      const mockChats = [
        {
          id: "chat-1",
          userId: "user-123",
          title: "Chat 1",
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { messages: 5 },
        },
        {
          id: "chat-2",
          userId: "user-123",
          title: "Chat 2",
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { messages: 10 },
        },
      ];

      vi.mocked(prisma.chat.findMany).mockResolvedValue(
        mockChats as unknown as Chat[]
      );

      const result = await getChatsByUserId("user-123");

      expect(result).toEqual(mockChats);
      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: {
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });
    });

    it("should return chats with custom limit", async () => {
      vi.mocked(prisma.chat.findMany).mockResolvedValue([]);

      await getChatsByUserId("user-123", 10);

      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: {
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      });
    });
  });
});
