# LLM Integration Documentation

## Overview

The LLM integration provides a unified interface for working with multiple AI providers (OpenAI, Anthropic) with support for both streaming and non-streaming responses. The system uses Zod for schema validation and Web Streams API for efficient streaming.

## Features

- ✅ **Unified Interface** - Single API for all LLM providers
- ✅ **OpenAI Streaming** - Full Web Streams implementation with token usage
- ✅ **Non-Streaming Fallback** - Traditional request/response pattern
- ✅ **Provider Selection** - Choose provider via `LLM_PROVIDER` env var
- ✅ **Zod Validation** - Type-safe request validation
- ✅ **TypeScript** - Full type safety throughout
- ⏳ **Anthropic Streaming** - TODO: SSE implementation needed

## Architecture

```
src/lib/llm/
├── index.ts       # Main exports and convenience functions
├── types.ts       # Shared types, interfaces, and Zod schemas
├── openai.ts      # OpenAI provider implementation
└── anthropic.ts   # Anthropic provider (TODO: streaming)
```

## Environment Variables

```env
# Choose provider (default: openai)
LLM_PROVIDER=openai  # or anthropic

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini  # optional, default model

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # optional
```

## Schema

### ChatRequest Schema

```typescript
const ChatSchema = z.object({
  system: z.string().optional(),
  messages: z.array(MessageSchema).min(1),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().positive().optional(),
  model: z.string().optional(),
});
```

### Message Schema

```typescript
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});
```

## API Reference

### Non-Streaming Chat

```typescript
import { chat } from "@/lib/llm";

async function getChatResponse() {
  const response = await chat({
    system: "You are a helpful assistant.",
    messages: [{ role: "user", content: "What is the capital of France?" }],
    temperature: 0.7,
    maxTokens: 100,
  });

  console.log(response.content); // "Paris is the capital of France."
  console.log(response.usage); // { promptTokens: 20, completionTokens: 8, totalTokens: 28 }
  console.log(response.model); // "gpt-4o-mini"
}
```

**Response Type:**

```typescript
interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "content_filter" | "tool_calls" | null;
}
```

### Streaming Chat

```typescript
import { chatStream } from "@/lib/llm";

async function streamResponse() {
  const stream = chatStream({
    system: "You are a helpful assistant.",
    messages: [{ role: "user", content: "Tell me a short story." }],
    stream: true,
  });

  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (value.done) {
      // Final chunk with metadata
      console.log("\nUsage:", value.usage);
      console.log("Model:", value.model);
      console.log("Finish reason:", value.finishReason);
    } else {
      // Content chunk
      process.stdout.write(value.content);
    }
  }
}
```

**Stream Chunk Type:**

```typescript
interface StreamChunk {
  content: string;
  done: boolean;
  model?: string;
  usage?: TokenUsage;
  finishReason?: "stop" | "length" | "content_filter" | "tool_calls" | null;
}
```

### Async Iterator (Simplified Streaming)

```typescript
import { chatStream, streamToAsyncIterable } from "@/lib/llm";

async function streamWithForAwait() {
  const stream = chatStream({
    messages: [{ role: "user", content: "Count to 10." }],
  });

  for await (const chunk of streamToAsyncIterable(stream)) {
    if (!chunk.done) {
      console.log(chunk.content);
    } else {
      console.log("Done! Usage:", chunk.usage);
    }
  }
}
```

### Collect Full Stream

```typescript
import { chatStream, collectStream } from "@/lib/llm";

async function getFullResponse() {
  const stream = chatStream({
    messages: [{ role: "user", content: "Explain quantum physics." }],
  });

  // Collects all chunks into final result
  const result = await collectStream(stream);

  console.log(result.content); // Full response text
  console.log(result.usage); // Token usage
  console.log(result.model); // Model name
}
```

### Provider Management

```typescript
import {
  getProvider,
  getProviderByType,
  getProviderStatus,
  getCurrentProviderName,
} from "@/lib/llm";

// Get current provider (based on LLM_PROVIDER env)
const provider = getProvider();
console.log(provider.getName()); // "OpenAI" or "Anthropic"

// Get specific provider
const openai = getProviderByType("openai");
const anthropic = getProviderByType("anthropic");

// Check which providers are configured
const status = getProviderStatus();
console.log(status.openai); // true/false
console.log(status.anthropic); // true/false

// Get current provider name
const name = getCurrentProviderName();
console.log(name); // "OpenAI"
```

## Usage Examples

### Simple Q&A

```typescript
import { chat } from "@/lib/llm";

export async function askQuestion(question: string): Promise<string> {
  const response = await chat({
    messages: [{ role: "user", content: question }],
    temperature: 0.3, // Lower temperature for factual responses
  });

  return response.content;
}
```

### Chat with History

```typescript
import { chat, type Message } from "@/lib/llm";

export async function continueChat(
  history: Message[],
  newMessage: string
): Promise<{ response: string; usage: TokenUsage }> {
  const response = await chat({
    system: "You are a helpful AI assistant.",
    messages: [...history, { role: "user", content: newMessage }],
    temperature: 0.7,
  });

  return {
    response: response.content,
    usage: response.usage,
  };
}
```

### Streaming to UI

```typescript
import { chatStream, streamToAsyncIterable } from "@/lib/llm";

export async function streamToClient(
  messages: Message[],
  onChunk: (text: string) => void,
  onComplete: (usage: TokenUsage) => void
) {
  const stream = chatStream({ messages });

  for await (const chunk of streamToAsyncIterable(stream)) {
    if (chunk.done) {
      if (chunk.usage) {
        onComplete(chunk.usage);
      }
    } else {
      onChunk(chunk.content);
    }
  }
}
```

### API Route with Streaming

```typescript
// app/api/chat/route.ts
import { chatStream } from "@/lib/llm";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const stream = chatStream({
    system: "You are a helpful assistant.",
    messages,
    stream: true,
  });

  // Convert to Response with streaming
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Server Action with Chat

```typescript
"use server";

import { chat } from "@/lib/llm";
import { appendMessage } from "@/lib/db";

export async function sendMessage(
  chatId: string,
  userMessage: string
): Promise<string> {
  // Save user message
  await appendMessage(chatId, {
    role: "user",
    content: userMessage,
  });

  // Get AI response
  const response = await chat({
    system: "You are a helpful assistant.",
    messages: [{ role: "user", content: userMessage }],
  });

  // Save assistant message
  await appendMessage(chatId, {
    role: "assistant",
    content: response.content,
    tokens: response.usage.completionTokens,
  });

  return response.content;
}
```

### With Error Handling

```typescript
import { chat, LLMProviderError, LLMAPIError } from "@/lib/llm";

export async function safeChat(userMessage: string): Promise<string> {
  try {
    const response = await chat({
      messages: [{ role: "user", content: userMessage }],
    });

    return response.content;
  } catch (error) {
    if (error instanceof LLMProviderError) {
      console.error("Provider not configured:", error.message);
      return "AI service is not configured. Please contact support.";
    }

    if (error instanceof LLMAPIError) {
      console.error(`${error.provider} API error:`, error.message);
      if (error.statusCode === 429) {
        return "Too many requests. Please try again later.";
      }
      return "AI service is temporarily unavailable.";
    }

    throw error;
  }
}
```

## Provider-Specific Details

### OpenAI Provider

**Status:** ✅ Fully implemented

**Features:**

- Streaming with Web Streams API
- Token usage tracking
- Finish reason reporting
- Support for all GPT models
- Automatic retry handling (via SDK)

**Models:**

- `gpt-4o` - Latest flagship model
- `gpt-4o-mini` - Fast, affordable (default)
- `gpt-4-turbo` - Previous generation
- `gpt-3.5-turbo` - Legacy, fast

**Configuration:**

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # optional
```

### Anthropic Provider

**Status:** ⏳ Partial implementation (TODO: Streaming)

**Current Features:**

- Provider detection
- Configuration checking
- Error handling

**TODO:**

1. Install `@anthropic-ai/sdk` package
2. Implement non-streaming `chat()` method
3. Implement SSE streaming for `chatStream()`
4. Parse Anthropic event format
5. Map to StreamChunk format

**Example Streaming TODO:**

```typescript
// TODO: Implement in anthropic.ts
const client = new Anthropic({ apiKey });

const stream = await client.messages.stream({
  model: "claude-3-5-sonnet-20241022",
  system: request.system,
  messages: this.formatMessages(request.messages),
  max_tokens: request.maxTokens || 4096,
});

for await (const event of stream) {
  if (event.type === "content_block_delta") {
    // Emit content chunk
  }
  if (event.type === "message_stop") {
    // Emit final chunk with usage
  }
}
```

**Reference:** https://docs.anthropic.com/claude/reference/streaming

## Error Handling

### LLMProviderError

Thrown when provider is not configured or invalid:

```typescript
try {
  const provider = getProvider();
} catch (error) {
  if (error instanceof LLMProviderError) {
    console.error("Provider error:", error.message);
    // "OpenAI provider is not configured..."
  }
}
```

### LLMAPIError

Thrown when API call fails:

```typescript
try {
  const response = await chat({ messages: [...] });
} catch (error) {
  if (error instanceof LLMAPIError) {
    console.error(`${error.provider} error:`, error.message);
    console.error("Status code:", error.statusCode);  // 429, 500, etc.
  }
}
```

## Best Practices

### 1. Always Validate Input

```typescript
import { ChatSchema } from "@/lib/llm";

// Validate user input before sending
const validated = ChatSchema.parse({
  messages: userMessages,
  temperature: userTemp,
});
```

### 2. Handle Streaming Errors

```typescript
const stream = chatStream({ messages });
const reader = stream.getReader();

try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // Process chunk
  }
} catch (error) {
  console.error("Stream error:", error);
} finally {
  reader.releaseLock();
}
```

### 3. Monitor Token Usage

```typescript
const response = await chat({ messages });

if (response.usage.totalTokens > 8000) {
  console.warn("High token usage:", response.usage);
}

// Track costs
const inputCost = (response.usage.promptTokens / 1000) * 0.03;
const outputCost = (response.usage.completionTokens / 1000) * 0.06;
```

### 4. Use Appropriate Temperatures

```typescript
// Factual/deterministic (0-0.3)
const factual = await chat({
  messages: [{ role: "user", content: "What is 2+2?" }],
  temperature: 0.1,
});

// Balanced (0.7-0.9)
const balanced = await chat({
  messages: [{ role: "user", content: "Write a story." }],
  temperature: 0.7,
});

// Creative (1.0-1.5)
const creative = await chat({
  messages: [{ role: "user", content: "Brainstorm ideas." }],
  temperature: 1.2,
});
```

### 5. Implement Rate Limiting

```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

export async function rateLimitedChat(userId: string, messages: Message[]) {
  const { success } = await ratelimit.limit(userId);

  if (!success) {
    throw new Error("Rate limit exceeded");
  }

  return await chat({ messages });
}
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect, vi } from "vitest";
import { chat, getProvider } from "@/lib/llm";

describe("LLM Integration", () => {
  it("should validate chat request schema", () => {
    expect(() =>
      chat({
        messages: [], // Empty array - invalid
      })
    ).rejects.toThrow();
  });

  it("should format messages correctly", async () => {
    const response = await chat({
      system: "Test system",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(response).toHaveProperty("content");
    expect(response).toHaveProperty("usage");
  });
});
```

## Migration Guide

### From Direct OpenAI SDK

**Before:**

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello" }],
});
```

**After:**

```typescript
import { chat } from "@/lib/llm";

const response = await chat({
  messages: [{ role: "user", content: "Hello" }],
});
```

### From String-Based to Typed Messages

**Before:**

```typescript
const messages = [
  { role: "user", content: "Hi" },
  { role: "bot", content: "Hello" }, // Wrong role
];
```

**After:**

```typescript
import { type Message } from "@/lib/llm";

const messages: Message[] = [
  { role: "user", content: "Hi" },
  { role: "assistant", content: "Hello" }, // Correct role
];
```

## Future Enhancements

- [ ] Implement Anthropic SSE streaming
- [ ] Add support for function calling / tools
- [ ] Implement token counting utilities
- [ ] Add retry logic with exponential backoff
- [ ] Support for image inputs (vision models)
- [ ] Prompt caching for Anthropic
- [ ] Model fallback/switching
- [ ] Request/response logging
- [ ] Performance metrics collection

## Troubleshooting

### Provider Not Configured

**Error:** `LLMProviderError: OpenAI provider is not configured`

**Solution:** Set `OPENAI_API_KEY` in `.env.local`

### Invalid Provider

**Error:** `LLMProviderError: Invalid LLM_PROVIDER: xyz`

**Solution:** Set `LLM_PROVIDER=openai` or `LLM_PROVIDER=anthropic`

### Streaming Not Working

**Check:**

1. Is `stream: true` in request?
2. Is provider properly configured?
3. For Anthropic: Streaming not yet implemented (TODO)

### High Latency

**Tips:**

1. Use streaming for better perceived performance
2. Choose faster models (gpt-4o-mini vs gpt-4o)
3. Reduce `maxTokens` parameter
4. Consider caching responses

## License

MIT
