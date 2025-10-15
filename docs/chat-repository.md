# Chat Repository Documentation

## Overview

The chat repository (`chatRepo.ts`) provides a clean, type-safe interface for managing chats and messages in the database. It includes comprehensive error handling, validation, and is fully tested.

## Features

- ✅ **Type-safe operations** with TypeScript
- ✅ **Comprehensive error handling** with custom error classes
- ✅ **Input validation** for message roles
- ✅ **Token tracking** for cost management
- ✅ **Fully tested** with Vitest (20 passing tests)
- ✅ **Prisma ORM** for database operations
- ✅ **Cascading deletes** for data integrity

## Database Schema

### Chat Model

```prisma
model Chat {
  id        String    @id @default(cuid())
  userId    String?
  title     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
}
```

### Message Model

```prisma
model Message {
  id        String   @id @default(cuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  role      String   // "user" | "assistant" | "system"
  content   String   @db.Text
  tokens    Int?
  createdAt DateTime @default(now())
}
```

## API Reference

### Types

#### `ChatWithMessages`

```typescript
type ChatWithMessages = Chat & {
  messages: Message[];
};
```

#### `MessageRole`

```typescript
type MessageRole = "user" | "assistant" | "system";
```

#### `CreateMessageInput`

```typescript
type CreateMessageInput = {
  role: MessageRole;
  content: string;
  tokens?: number;
};
```

#### `TokenTotals`

```typescript
type TokenTotals = {
  userTokens: number;
  assistantTokens: number;
  systemTokens: number;
  totalTokens: number;
};
```

### Functions

#### `getOrCreateChat(chatId?, userId?, title?)`

Get an existing chat or create a new one.

**Parameters:**

- `chatId?: string` - Optional chat ID. If provided, fetches existing chat
- `userId?: string` - Optional user ID to associate with new chat
- `title?: string` - Optional title for new chat

**Returns:** `Promise<ChatWithMessages>`

**Throws:**

- `ChatNotFoundError` - If chatId is provided but doesn't exist

**Examples:**

```typescript
// Create a new chat
const newChat = await getOrCreateChat(undefined, "user-123", "My Chat");

// Get existing chat
const existingChat = await getOrCreateChat("chat-abc-123");

// Create anonymous chat
const anonChat = await getOrCreateChat();
```

---

#### `appendMessage(chatId, messageInput)`

Append a message to an existing chat.

**Parameters:**

- `chatId: string` - The chat ID to append to
- `messageInput: CreateMessageInput` - The message data

**Returns:** `Promise<Message>`

**Throws:**

- `ChatNotFoundError` - If chat doesn't exist
- `InvalidMessageRoleError` - If role is not valid

**Examples:**

```typescript
// Add user message
const userMsg = await appendMessage("chat-123", {
  role: "user",
  content: "Hello, AI!",
  tokens: 15,
});

// Add assistant response
const assistantMsg = await appendMessage("chat-123", {
  role: "assistant",
  content: "Hello! How can I help?",
  tokens: 25,
});

// Add system message
const systemMsg = await appendMessage("chat-123", {
  role: "system",
  content: "You are a helpful assistant.",
});
```

---

#### `computeTokenTotals(chatId)`

Calculate token usage for a chat, broken down by role.

**Parameters:**

- `chatId: string` - The chat ID to compute tokens for

**Returns:** `Promise<TokenTotals>`

**Throws:**

- `ChatNotFoundError` - If chat doesn't exist

**Example:**

```typescript
const totals = await computeTokenTotals("chat-123");
console.log(totals);
// {
//   userTokens: 150,
//   assistantTokens: 320,
//   systemTokens: 25,
//   totalTokens: 495
// }
```

---

#### `getChatById(chatId)`

Get a chat by ID with all messages.

**Parameters:**

- `chatId: string` - The chat ID to retrieve

**Returns:** `Promise<ChatWithMessages | null>`

**Example:**

```typescript
const chat = await getChatById("chat-123");
if (chat) {
  console.log(`Chat has ${chat.messages.length} messages`);
}
```

---

#### `deleteChat(chatId)`

Delete a chat and all its messages (cascade delete).

**Parameters:**

- `chatId: string` - The chat ID to delete

**Returns:** `Promise<Chat>`

**Throws:**

- `ChatNotFoundError` - If chat doesn't exist

**Example:**

```typescript
await deleteChat("chat-123");
console.log("Chat and all messages deleted");
```

---

#### `getChatsByUserId(userId, limit?)`

Get all chats for a user, ordered by most recent.

**Parameters:**

- `userId: string` - The user ID
- `limit?: number` - Maximum chats to return (default: 50)

**Returns:** `Promise<Array<Chat & { _count: { messages: number } }>>`

**Example:**

```typescript
const userChats = await getChatsByUserId("user-123", 20);
userChats.forEach((chat) => {
  console.log(`${chat.title}: ${chat._count.messages} messages`);
});
```

## Error Handling

### `ChatNotFoundError`

Thrown when a chat ID is provided but doesn't exist in the database.

```typescript
try {
  await getOrCreateChat("invalid-id");
} catch (error) {
  if (error instanceof ChatNotFoundError) {
    console.error("Chat not found:", error.message);
  }
}
```

### `InvalidMessageRoleError`

Thrown when an invalid message role is provided.

```typescript
try {
  await appendMessage("chat-123", {
    role: "admin", // Invalid!
    content: "Test",
  });
} catch (error) {
  if (error instanceof InvalidMessageRoleError) {
    console.error("Invalid role:", error.message);
  }
}
```

## Usage Examples

### Complete Chat Flow

```typescript
import {
  getOrCreateChat,
  appendMessage,
  computeTokenTotals,
  ChatNotFoundError,
} from "@/lib/db";

async function handleChatMessage(userId: string, userMessage: string) {
  try {
    // Create or get chat
    const chat = await getOrCreateChat(undefined, userId, "New Conversation");

    // Add user message
    await appendMessage(chat.id, {
      role: "user",
      content: userMessage,
      tokens: estimateTokens(userMessage),
    });

    // Get AI response (placeholder)
    const aiResponse = await getAIResponse(userMessage);

    // Add assistant message
    await appendMessage(chat.id, {
      role: "assistant",
      content: aiResponse,
      tokens: estimateTokens(aiResponse),
    });

    // Check token usage
    const totals = await computeTokenTotals(chat.id);
    if (totals.totalTokens > 10000) {
      console.warn("High token usage!");
    }

    return chat;
  } catch (error) {
    if (error instanceof ChatNotFoundError) {
      console.error("Chat not found");
    }
    throw error;
  }
}
```

### Cost Tracking

```typescript
async function calculateChatCost(chatId: string) {
  const totals = await computeTokenTotals(chatId);

  // Example pricing (adjust for your provider)
  const inputCostPer1k = 0.03; // $0.03 per 1k tokens
  const outputCostPer1k = 0.06; // $0.06 per 1k tokens

  const inputCost = (totals.userTokens / 1000) * inputCostPer1k;
  const outputCost = (totals.assistantTokens / 1000) * outputCostPer1k;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    tokens: totals,
  };
}
```

### User Dashboard

```typescript
async function getUserDashboard(userId: string) {
  const chats = await getChatsByUserId(userId, 10);

  const dashboard = await Promise.all(
    chats.map(async (chat) => {
      const totals = await computeTokenTotals(chat.id);
      return {
        id: chat.id,
        title: chat.title,
        messageCount: chat._count.messages,
        tokenUsage: totals.totalTokens,
        lastUpdated: chat.updatedAt,
      };
    })
  );

  return dashboard;
}
```

## Testing

The repository includes comprehensive unit tests covering:

- ✅ Happy paths for all functions
- ✅ Error scenarios (chat not found, invalid roles)
- ✅ Edge cases (null tokens, empty chats, single role)
- ✅ Proper mock usage for isolated testing

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Test Coverage

- **20 tests** - All passing ✅
- **6 functions** - Fully tested
- **2 error classes** - Behavior validated
- **Multiple edge cases** - Covered

## Database Setup

### Initial Migration

```bash
# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Environment Variables

Add to `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chatcanvas?schema=public"
```

## Best Practices

1. **Always check token totals** after adding messages to monitor costs
2. **Use transactions** for operations that modify multiple records
3. **Handle errors gracefully** with try-catch blocks
4. **Validate user input** before passing to repository functions
5. **Index frequently queried fields** (userId, createdAt)
6. **Monitor query performance** in production

## Performance Considerations

- Messages are ordered by `createdAt` (indexed)
- User chats use `updatedAt DESC` for recent-first ordering
- Cascade deletes handle message cleanup automatically
- Consider pagination for large message lists
- Token computation is done in a single query with message selection

## Migration Guide

If you need to modify the schema:

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration_name`
3. Update types in `chatRepo.ts` if needed
4. Update tests to match new behavior
5. Run tests: `npm run test:run`

## Contributing

When adding new functions:

1. Add comprehensive JSDoc comments
2. Include parameter validation
3. Throw appropriate custom errors
4. Write unit tests (happy + error paths)
5. Update this documentation

## License

MIT
