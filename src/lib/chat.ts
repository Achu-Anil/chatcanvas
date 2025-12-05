import { prisma } from "./db/prisma";

interface SaveChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SaveChatParams {
  chatId: string;
  messages: SaveChatMessage[];
  title?: string;
  userId?: string;
}

export async function saveChat({
  chatId,
  messages,
  title,
  userId,
}: SaveChatParams) {
  return prisma.$transaction(async (tx) => {
    const existingChat = await tx.chat.findUnique({
      where: { id: chatId },
    });

    if (!existingChat) {
      await tx.chat.create({
        data: {
          id: chatId,
          title: title || messages[0]?.content.slice(0, 50) || "New Chat",
          userId,
        },
      });
    }

    await tx.message.createMany({
      data: messages.map((msg) => ({
        chatId,
        role: msg.role,
        content: msg.content,
      })),
      skipDuplicates: true,
    });
  });
}

export async function getChatHistory(chatId: string) {
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));
}
