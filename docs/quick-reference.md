# Quick Reference: LLM Providers

## 🚀 Quick Start

### Environment Setup

```env
# Choose your provider
LLM_PROVIDER=anthropic  # or openai

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## 📖 Basic Usage

### Non-Streaming

```typescript
import { chat } from "@/lib/llm";

const response = await chat({
  system: "You are a helpful assistant.",
  messages: [{ role: "user", content: "Hello!" }],
  temperature: 0.7, // optional
  maxTokens: 1000, // optional
});

console.log(response.content);
console.log(response.usage.totalTokens);
```

### Streaming

```typescript
import { chatStream, streamToAsyncIterable } from "@/lib/llm";

const stream = chatStream({
  messages: [{ role: "user", content: "Tell me a story" }],
});

for await (const chunk of streamToAsyncIterable(stream)) {
  if (!chunk.done) {
    process.stdout.write(chunk.content);
  } else {
    console.log("\nTokens:", chunk.usage?.totalTokens);
  }
}
```

## 🎯 Provider-Specific

### Use Specific Provider

```typescript
import { getProviderByType } from "@/lib/llm";

const anthropic = getProviderByType("anthropic");
const openai = getProviderByType("openai");

const response1 = await anthropic.chat({ messages: [...] });
const response2 = await openai.chat({ messages: [...] });
```

### Check Configuration

```typescript
import { getProviderStatus, getCurrentProviderName } from "@/lib/llm";

const status = getProviderStatus();
console.log("OpenAI:", status.openai); // true/false
console.log("Anthropic:", status.anthropic); // true/false

console.log("Current:", getCurrentProviderName()); // "OpenAI" or "Anthropic"
```

## 🔧 API Routes

### Basic Streaming Route

```typescript
// app/api/chat/route.ts
import { chatStream } from "@/lib/llm";

export const runtime = "edge"; // optional

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chatStream({ messages });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
```

### With Database Integration

```typescript
import { chatStream } from "@/lib/llm";
import { appendMessage, getOrCreateChat } from "@/lib/db";

export async function POST(request: Request) {
  const { userId, message } = await request.json();

  const chat = await getOrCreateChat(userId);
  await appendMessage(chat.id, {
    role: "user",
    content: message,
  });

  const stream = chatStream({
    system: "You are helpful.",
    messages: [{ role: "user", content: message }],
  });

  // Save assistant response after streaming
  let fullContent = "";
  const transformedStream = new TransformStream({
    transform(chunk, controller) {
      if (!chunk.done) {
        fullContent += chunk.content;
      } else {
        // Save to DB when done
        appendMessage(chat.id, {
          role: "assistant",
          content: fullContent,
          tokens: chunk.usage?.completionTokens,
        });
      }
      controller.enqueue(chunk);
    },
  });

  return new Response(stream.pipeThrough(transformedStream), {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

## ⚠️ Error Handling

```typescript
import { chat, LLMProviderError, LLMAPIError } from "@/lib/llm";
import { ZodError } from "zod";

try {
  const response = await chat({ messages: [...] });
} catch (error) {
  if (error instanceof LLMProviderError) {
    // Provider not configured (missing API key)
    console.error("Config error:", error.message);
  } else if (error instanceof LLMAPIError) {
    // API error (rate limit, invalid request)
    console.error(`${error.provider} error:`, error.message);
    console.error("Status code:", error.statusCode);
  } else if (error instanceof ZodError) {
    // Invalid input
    console.error("Validation:", error.errors);
  }
}
```

## 🎨 Client-Side Usage

### Fetch Streaming

```typescript
async function sendMessage(message: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: message }],
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    console.log(text);
  }
}
```

### React Hook

```typescript
import { useState } from "react";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(content: string) {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content }]);

    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [...messages, { role: "user", content }],
      }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      assistantMessage += text;

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: assistantMessage },
      ]);
    }

    setIsLoading(false);
  }

  return { messages, sendMessage, isLoading };
}
```

## 🧪 Testing

### Run Tests

```bash
# All tests
npm run test:run

# LLM tests only
npm run test:run -- src/lib/llm

# Watch mode
npm run test

# Coverage
npm run test:coverage
```

### Mock in Tests

```typescript
import { vi } from "vitest";

// Mock the entire module
vi.mock("@/lib/llm", () => ({
  chat: vi.fn().mockResolvedValue({
    content: "Mocked response",
    usage: { totalTokens: 10 },
  }),
  chatStream: vi.fn(),
}));

// Use in test
const { chat } = await import("@/lib/llm");
await chat({ messages: [...] });
expect(chat).toHaveBeenCalled();
```

## 📊 Utility Functions

### Collect Stream

```typescript
import { chatStream, collectStream } from "@/lib/llm";

const stream = chatStream({ messages: [...] });
const result = await collectStream(stream);

console.log(result.content);    // Full response
console.log(result.usage);      // Token usage
console.log(result.model);      // Model used
```

### Stream to Async Iterable

```typescript
import { chatStream, streamToAsyncIterable } from "@/lib/llm";

const stream = chatStream({ messages: [...] });

for await (const chunk of streamToAsyncIterable(stream)) {
  console.log(chunk);
}
```

## 🔍 Type Reference

### Request Types

```typescript
interface ChatRequestInput {
  system?: string;
  messages: Message[];
  stream?: boolean; // default: false
  temperature?: number; // default: 0.7, range: 0-2
  maxTokens?: number;
  model?: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}
```

### Response Types

```typescript
interface ChatResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  finishReason: "stop" | "length" | "content_filter" | "tool_calls" | null;
}

interface StreamChunk {
  content: string;
  done: boolean;
  model?: string;
  usage?: TokenUsage;
  finishReason?: "stop" | "length" | "content_filter" | "tool_calls" | null;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

## 🎯 Common Patterns

### Retry Logic

```typescript
async function chatWithRetry(request: ChatRequestInput, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await chat(request);
    } catch (error) {
      if (error instanceof LLMAPIError && error.statusCode === 429) {
        // Rate limited - wait and retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Provider Fallback

```typescript
import { getProviderByType, LLMAPIError } from "@/lib/llm";

async function chatWithFallback(request: ChatRequestInput) {
  const providers = ["anthropic", "openai"] as const;

  for (const providerName of providers) {
    try {
      const provider = getProviderByType(providerName);
      if (!provider.isConfigured()) continue;

      return await provider.chat(request);
    } catch (error) {
      if (error instanceof LLMAPIError) {
        console.error(`${providerName} failed:`, error.message);
        continue;
      }
      throw error;
    }
  }

  throw new Error("All providers failed");
}
```

### Token Usage Tracking

```typescript
let totalTokens = 0;

async function trackedChat(request: ChatRequestInput) {
  const response = await chat(request);
  totalTokens += response.usage.totalTokens;

  console.log(`Tokens used: ${response.usage.totalTokens}`);
  console.log(`Total tokens: ${totalTokens}`);

  return response;
}
```

## 📚 More Resources

- **Full Guide:** `docs/anthropic-implementation.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Test Examples:** `src/lib/llm/*.test.ts`
- **Type Definitions:** `src/lib/llm/types.ts`

---

**Quick Tip:** Both providers use the same interface, so you can swap them without changing your code!
