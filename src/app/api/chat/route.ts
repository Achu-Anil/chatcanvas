import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ChatSchema,
  chatStream,
  LLMAPIError,
  LLMProviderError,
} from "@/lib/llm";
import type { StreamChunk } from "@/lib/llm";
import { prisma } from "@/lib/db/prisma";
import { getCurrentProviderName } from "@/lib/llm";

// Use Edge Runtime for optimal streaming performance
export const runtime = "edge";

/**
 * Request body schema
 */
interface ChatRequestBody {
  chatId: string;
  userId?: string;
  system?: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * POST /api/chat
 *
 * Handles streaming chat completion with database logging.
 *
 * Flow:
 * 1. Validate request body with ChatSchema
 * 2. Start LLM streaming
 * 3. Tee the stream to collect response text
 * 4. Save user + assistant messages in a transaction
 * 5. Return original stream to client
 *
 * @param request - Next.js request object
 * @returns Streaming response or error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = (await request.json()) as ChatRequestBody;

    // Validate with ChatSchema (will throw ZodError if invalid)
    const validated = ChatSchema.parse({
      system: body.system,
      messages: body.messages,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      model: body.model,
      stream: true, // Always use streaming
    });

    const { chatId, userId } = body;
    const userMessage = validated.messages[validated.messages.length - 1];

    if (!userMessage || userMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    // Get provider name for logging
    const provider = getCurrentProviderName();

    // Start streaming from LLM
    const llmStream = chatStream(validated);

    // Tee the stream: one for client, one for collecting text
    const [clientStream, collectorStream] = llmStream.tee();

    // Collect the full response in the background
    collectAndSaveResponse(
      collectorStream,
      chatId,
      userId,
      userMessage.content,
      provider,
      startTime
    ).catch((error) => {
      // Log error but don't disrupt the client stream
      console.error("Failed to save messages to database:", error);
    });

    // Return the original stream to the client
    return new Response(clientStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Provider": provider,
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle LLM provider errors
    if (error instanceof LLMProviderError) {
      return NextResponse.json(
        {
          error: "Provider configuration error",
          message: error.message,
        },
        { status: 503 }
      );
    }

    // Handle LLM API errors
    if (error instanceof LLMAPIError) {
      return NextResponse.json(
        {
          error: "LLM API error",
          message: error.message,
          provider: error.provider,
          statusCode: error.statusCode,
        },
        { status: error.statusCode || 500 }
      );
    }

    // Generic error
    console.error("Unexpected error in chat API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Collect response from stream and save to database
 *
 * @param stream - Stream to collect from
 * @param chatId - Chat ID to save messages to
 * @param userId - Optional user ID
 * @param userMessageContent - Content of user's message
 * @param provider - LLM provider name
 * @param startTime - Request start timestamp
 */
async function collectAndSaveResponse(
  stream: ReadableStream<StreamChunk>,
  chatId: string,
  userId: string | undefined,
  userMessageContent: string,
  provider: string,
  startTime: number
): Promise<void> {
  const reader = stream.getReader();
  let assistantContent = "";
  let completionTokens = 0;
  let finishReason: string | null = null;

  try {
    // Collect all chunks
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value.done) {
        // Final chunk with metadata
        completionTokens = value.usage?.completionTokens || 0;
        finishReason = value.finishReason || null;
      } else {
        // Content chunk
        assistantContent += value.content;
      }
    }

    // Calculate latency
    const latencyMs = Date.now() - startTime;

    // Save both messages in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      // Ensure chat exists or create it
      let chat = await tx.chat.findUnique({
        where: { id: chatId },
        select: { id: true },
      });

      if (!chat) {
        chat = await tx.chat.create({
          data: {
            id: chatId,
            userId,
            title: userMessageContent.substring(0, 100), // Use first 100 chars as title
          },
          select: { id: true },
        });
      }

      // Save user message
      await tx.message.create({
        data: {
          chatId,
          role: "user",
          content: userMessageContent,
          tokens: null, // We don't know prompt tokens for this single message
        },
      });

      // Save assistant message with metadata
      await tx.message.create({
        data: {
          chatId,
          role: "assistant",
          content: assistantContent,
          tokens: completionTokens,
        },
      });

      // Update chat timestamp
      await tx.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });
    });

    // Log success
    console.log(
      `Chat ${chatId}: Saved messages (${provider}, ${latencyMs}ms, ${completionTokens} tokens, finish: ${finishReason})`
    );
  } catch (error) {
    console.error("Error collecting and saving response:", error);
    throw error;
  } finally {
    reader.releaseLock();
  }
}
