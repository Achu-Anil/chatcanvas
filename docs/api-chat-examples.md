# Chat API Example Client

## React Component with Streaming

```typescript
"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export function ChatInterface({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          messages: [...messages, userMessage],
          system: "You are a helpful assistant.",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }

      // Read the streaming response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        // Update the assistant message
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return newMessages;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Remove the empty assistant message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat Interface</h1>
        <p className="text-sm text-gray-500">Chat ID: {chatId}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {message.role === "user" ? "You" : "Assistant"}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">●</div>
                <div className="animate-pulse animation-delay-200">●</div>
                <div className="animate-pulse animation-delay-400">●</div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
```

## Usage in Page

```typescript
// app/chat/[id]/page.tsx
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage({ params }: { params: { id: string } }) {
  return <ChatInterface chatId={params.id} />;
}
```

## Custom Hook for Reusability

```typescript
// hooks/useChat.ts
import { useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UseChatOptions {
  chatId: string;
  systemMessage?: string;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useChat({
  chatId,
  systemMessage,
  onError,
  onComplete,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            system: systemMessage,
            messages: [...messages, userMessage],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to send message");
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: assistantContent,
            };
            return newMessages;
          });
        }

        onComplete?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        onError?.(error);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [chatId, systemMessage, messages, isLoading, onError, onComplete]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
```

## TypeScript Utilities

```typescript
// lib/chat-utils.ts

/**
 * Parse streaming response with proper chunk handling
 */
export async function* parseStreamingResponse(
  response: Response
): AsyncGenerator<string, void, unknown> {
  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Collect full response from stream
 */
export async function collectStreamingResponse(
  response: Response
): Promise<string> {
  let content = "";

  for await (const chunk of parseStreamingResponse(response)) {
    content += chunk;
  }

  return content;
}

/**
 * Validate chat request before sending
 */
export function validateChatRequest(request: {
  chatId: string;
  messages: Array<{ role: string; content: string }>;
}): void {
  if (!request.chatId) {
    throw new Error("Chat ID is required");
  }

  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new Error("At least one message is required");
  }

  const lastMessage = request.messages[request.messages.length - 1];
  if (lastMessage.role !== "user") {
    throw new Error("Last message must be from user");
  }

  for (const msg of request.messages) {
    if (!msg.content || !msg.content.trim()) {
      throw new Error("Message content cannot be empty");
    }
  }
}
```

## Error Handling Examples

```typescript
// Comprehensive error handling
async function sendMessageWithRetry(
  chatId: string,
  content: string,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          messages: [{ role: "user", content }],
        }),
      });

      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = parseInt(response.headers.get("Retry-After") || "5");
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

## Testing Example

```typescript
// __tests__/chat-api.test.ts
import { describe, it, expect, vi } from "vitest";

describe("Chat API Client", () => {
  it("should handle streaming response", async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode("Hello"),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(" World"),
            })
            .mockResolvedValueOnce({ done: true }),
          releaseLock: vi.fn(),
        }),
      },
    });

    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        chatId: "test",
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let content = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      content += decoder.decode(value);
    }

    expect(content).toBe("Hello World");
  });
});
```

---

**These examples provide a complete foundation for building chat interfaces with the streaming API!**
