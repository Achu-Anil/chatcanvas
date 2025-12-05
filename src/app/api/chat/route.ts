import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { z } from "zod";
import { saveChat } from "@/lib/chat";

export const runtime = "edge";

const requestSchema = z.object({
  chatId: z.string(),
  userId: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  model: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId, userId, messages, temperature, maxTokens, model } =
      requestSchema.parse(body);

    const latestUserMessage = messages[messages.length - 1];

    if (!latestUserMessage || latestUserMessage.role !== "user") {
      return Response.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    const providerType = (process.env.LLM_PROVIDER || "openai").toLowerCase();
    const defaultModel =
      providerType === "anthropic"
        ? "claude-3-5-sonnet-20241022"
        : "gpt-4o-mini";

    const selectedModel = model || defaultModel;
    const modelInstance =
      providerType === "anthropic"
        ? anthropic(selectedModel)
        : openai(selectedModel);

    const result = streamText({
      model: modelInstance,
      messages,
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 2000,
      async onFinish({ text, usage, finishReason }) {
        try {
          await saveChat({
            chatId,
            userId,
            messages: [
              {
                role: "user",
                content: latestUserMessage.content,
              },
              {
                role: "assistant",
                content: text,
              },
            ],
          });

          console.log(
            `Chat ${chatId} saved | Provider: ${providerType} | Tokens: ${usage.totalTokens} | Finish: ${finishReason}`
          );
        } catch (error) {
          console.error("Failed to save chat:", error);
        }
      },
    });

    return result.toDataStreamResponse({
      headers: {
        "X-Provider": providerType,
        "X-Model": selectedModel,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Chat API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
