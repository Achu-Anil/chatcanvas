import { prisma } from "./prisma";
import type { Chat, Message } from "@prisma/client";

/**
 * Exported types for chat repository
 */
export type ChatWithMessages = Chat & {
  messages: Message[];
};

export type MessageRole = "user" | "assistant" | "system";

export type CreateMessageInput = {
  role: MessageRole;
  content: string;
  tokens?: number;
};

export type TokenTotals = {
  userTokens: number;
  assistantTokens: number;
  systemTokens: number;
  totalTokens: number;
};

/**
 * Error classes for better error handling
 */
export class ChatNotFoundError extends Error {
  constructor(chatId: string) {
    super(`Chat with id ${chatId} not found`);
    this.name = "ChatNotFoundError";
  }
}

export class InvalidMessageRoleError extends Error {
  constructor(role: string) {
    super(
      `Invalid message role: ${role}. Must be one of: user, assistant, system`
    );
    this.name = "InvalidMessageRoleError";
  }
}

/**
 * Validates message role
 */
function validateMessageRole(role: string): asserts role is MessageRole {
  const validRoles: MessageRole[] = ["user", "assistant", "system"];
  if (!validRoles.includes(role as MessageRole)) {
    throw new InvalidMessageRoleError(role);
  }
}

/**
 * Get an existing chat by ID or create a new chat
 *
 * @param chatId - Optional chat ID. If not provided, creates a new chat
 * @param userId - Optional user ID to associate with the chat
 * @param title - Optional title for the chat
 * @returns Chat with all messages
 * @throws ChatNotFoundError if chatId is provided but chat doesn't exist
 */
export async function getOrCreateChat(
  chatId?: string,
  userId?: string,
  title?: string
): Promise<ChatWithMessages> {
  // If chatId is provided, try to get existing chat
  if (chatId) {
    const existingChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!existingChat) {
      throw new ChatNotFoundError(chatId);
    }

    return existingChat;
  }

  // Create a new chat
  const newChat = await prisma.chat.create({
    data: {
      userId,
      title,
    },
    include: {
      messages: true,
    },
  });

  return newChat;
}

/**
 * Append a message to an existing chat
 *
 * @param chatId - The chat ID to append the message to
 * @param messageInput - The message data to append
 * @returns The created message
 * @throws ChatNotFoundError if chat doesn't exist
 * @throws InvalidMessageRoleError if role is invalid
 */
export async function appendMessage(
  chatId: string,
  messageInput: CreateMessageInput
): Promise<Message> {
  // Validate role
  validateMessageRole(messageInput.role);

  // Check if chat exists
  const chatExists = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true },
  });

  if (!chatExists) {
    throw new ChatNotFoundError(chatId);
  }

  // Create the message
  const message = await prisma.message.create({
    data: {
      chatId,
      role: messageInput.role,
      content: messageInput.content,
      tokens: messageInput.tokens,
    },
  });

  // Update chat's updatedAt timestamp
  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  return message;
}

/**
 * Compute token totals for a chat
 *
 * @param chatId - The chat ID to compute tokens for
 * @returns Token totals broken down by role
 * @throws ChatNotFoundError if chat doesn't exist
 */
export async function computeTokenTotals(chatId: string): Promise<TokenTotals> {
  // Check if chat exists
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        select: {
          role: true,
          tokens: true,
        },
      },
    },
  });

  if (!chat) {
    throw new ChatNotFoundError(chatId);
  }

  // Initialize totals
  const totals: TokenTotals = {
    userTokens: 0,
    assistantTokens: 0,
    systemTokens: 0,
    totalTokens: 0,
  };

  // Sum up tokens by role
  for (const message of chat.messages) {
    const tokens = message.tokens ?? 0;

    switch (message.role) {
      case "user":
        totals.userTokens += tokens;
        break;
      case "assistant":
        totals.assistantTokens += tokens;
        break;
      case "system":
        totals.systemTokens += tokens;
        break;
    }

    totals.totalTokens += tokens;
  }

  return totals;
}

/**
 * Get a chat by ID with all messages
 *
 * @param chatId - The chat ID to retrieve
 * @returns Chat with messages or null if not found
 */
export async function getChatById(
  chatId: string
): Promise<ChatWithMessages | null> {
  return prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/**
 * Delete a chat and all its messages
 *
 * @param chatId - The chat ID to delete
 * @returns The deleted chat
 * @throws ChatNotFoundError if chat doesn't exist
 */
export async function deleteChat(chatId: string): Promise<Chat> {
  try {
    return await prisma.chat.delete({
      where: { id: chatId },
    });
  } catch {
    throw new ChatNotFoundError(chatId);
  }
}

/**
 * Get all chats for a user
 *
 * @param userId - The user ID
 * @param limit - Maximum number of chats to return
 * @returns Array of chats with message counts
 */
export async function getChatsByUserId(
  userId: string,
  limit: number = 50
): Promise<Array<Chat & { _count: { messages: number } }>> {
  return prisma.chat.findMany({
    where: { userId },
    include: {
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
