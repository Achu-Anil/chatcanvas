import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveChat, getChatHistory } from "./chat";
import { prisma } from "./db/prisma";

// Mock Prisma
vi.mock("./db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    message: {
      findMany: vi.fn(),
    },
  },
}));

describe("chat.ts Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveChat", () => {
    it("should create new chat and save messages", async () => {
      const mockTransaction = vi.fn(async (callback) => {
        const tx = {
          chat: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: "chat-1" }),
          },
          message: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(tx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await saveChat({
        chatId: "chat-1",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
        ],
        userId: "user-1",
      });

      expect(mockTransaction).toHaveBeenCalledOnce();
    });

    it("should use custom title when provided", async () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: "chat-1" });
      const mockTransaction = vi.fn(async (callback) => {
        const tx = {
          chat: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: mockCreate,
          },
          message: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await saveChat({
        chatId: "chat-1",
        messages: [{ role: "user", content: "Hello" }],
        title: "Custom Title",
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          id: "chat-1",
          title: "Custom Title",
          userId: undefined,
        },
      });
    });

    it("should generate title from first message if not provided", async () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: "chat-1" });
      const mockTransaction = vi.fn(async (callback) => {
        const tx = {
          chat: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: mockCreate,
          },
          message: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await saveChat({
        chatId: "chat-1",
        messages: [
          {
            role: "user",
            content:
              "This is a very long message that should be truncated to 50 characters",
          },
        ],
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          id: "chat-1",
          title: "This is a very long message that should be truncat",
          userId: undefined,
        },
      });
    });

    it("should not create chat if it already exists", async () => {
      const mockCreate = vi.fn();
      const mockTransaction = vi.fn(async (callback) => {
        const tx = {
          chat: {
            findUnique: vi.fn().mockResolvedValue({ id: "chat-1" }),
            create: mockCreate,
          },
          message: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await saveChat({
        chatId: "chat-1",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("should skip duplicate messages", async () => {
      const mockCreateMany = vi.fn().mockResolvedValue({ count: 2 });
      const mockTransaction = vi.fn(async (callback) => {
        const tx = {
          chat: {
            findUnique: vi.fn().mockResolvedValue({ id: "chat-1" }),
            create: vi.fn(),
          },
          message: {
            createMany: mockCreateMany,
          },
        };
        return callback(tx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await saveChat({
        chatId: "chat-1",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi!" },
        ],
      });

      expect(mockCreateMany).toHaveBeenCalledWith({
        data: [
          { chatId: "chat-1", role: "user", content: "Hello" },
          { chatId: "chat-1", role: "assistant", content: "Hi!" },
        ],
        skipDuplicates: true,
      });
    });

    it("should use 'New Chat' as default title for empty messages", async () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: "chat-1" });
      const mockTransaction = vi.fn(async (callback) => {
        const tx = {
          chat: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: mockCreate,
          },
          message: {
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(tx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await saveChat({
        chatId: "chat-1",
        messages: [],
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          id: "chat-1",
          title: "New Chat",
          userId: undefined,
        },
      });
    });
  });

  describe("getChatHistory", () => {
    it("should retrieve and format chat messages", async () => {
      const mockMessages = [
        {
          id: "1",
          chatId: "chat-1",
          role: "user",
          content: "Hello",
          createdAt: new Date("2025-01-01"),
        },
        {
          id: "2",
          chatId: "chat-1",
          role: "assistant",
          content: "Hi there!",
          createdAt: new Date("2025-01-02"),
        },
      ];

      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages);

      const result = await getChatHistory("chat-1");

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chatId: "chat-1" },
        orderBy: { createdAt: "asc" },
      });

      expect(result).toEqual([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ]);
    });

    it("should return empty array for chat with no messages", async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue([]);

      const result = await getChatHistory("nonexistent-chat");

      expect(result).toEqual([]);
    });

    it("should order messages by creation time", async () => {
      const mockMessages = [
        {
          id: "1",
          chatId: "chat-1",
          role: "user",
          content: "First",
          createdAt: new Date("2025-01-01"),
        },
        {
          id: "2",
          chatId: "chat-1",
          role: "assistant",
          content: "Second",
          createdAt: new Date("2025-01-02"),
        },
      ];

      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages);

      await getChatHistory("chat-1");

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "asc" },
        })
      );
    });
  });
});
