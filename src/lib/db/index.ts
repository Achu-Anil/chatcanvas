/**
 * Database repository exports
 *
 * This module provides database operations for chat and message management.
 */

export {
  // Main functions
  getOrCreateChat,
  appendMessage,
  computeTokenTotals,
  getChatById,
  deleteChat,
  getChatsByUserId,

  // Error classes
  ChatNotFoundError,
  InvalidMessageRoleError,

  // Types
  type ChatWithMessages,
  type MessageRole,
  type CreateMessageInput,
  type TokenTotals,
} from "./chatRepo";

export { prisma } from "./prisma";
