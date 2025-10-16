import { prisma } from "@/lib/db/prisma";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, User, Bot, Clock, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Force dynamic rendering (no static generation)
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Type definitions
 */
type MessagePreview = {
  id: string;
  role: string;
  content: string;
  tokens: number | null;
  createdAt: Date;
};

type ChatWithMessages = {
  id: string;
  userId: string | null;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: MessagePreview[];
  _count: {
    messages: number;
  };
};

/**
 * Admin Dashboard - Recent Chats
 *
 * Server Component that queries and displays the 20 most recent chats
 * with their first 3 messages, provider info, and latency data.
 */
export default async function AdminPage() {
  // Query recent chats with first 3 messages
  const recentChats = await prisma.chat.findMany({
    take: 20,
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      messages: {
        take: 3,
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          role: true,
          content: true,
          tokens: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  // Calculate stats
  const totalChats = await prisma.chat.count();
  const totalMessages = await prisma.message.count();
  const totalTokens = await prisma.message.aggregate({
    _sum: {
      tokens: true,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor recent conversations and system metrics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChats}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Messages
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all chats
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tokens
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalTokens._sum.tokens?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completion tokens
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Chats */}
        <section aria-labelledby="recent-chats-heading">
          <h2 id="recent-chats-heading" className="text-2xl font-semibold mb-4">
            Recent Conversations
          </h2>

          {recentChats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start a chat to see it appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-6" role="list">
              {recentChats.map((chat) => (
                <li key={chat.id}>
                  <ChatCard chat={chat} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Individual Chat Card Component
 */
function ChatCard({ chat }: { chat: ChatWithMessages }) {
  const messageCount = chat._count.messages;
  const hasMoreMessages = messageCount > 3;
  const timeAgo = formatDistanceToNow(new Date(chat.updatedAt), {
    addSuffix: true,
  });

  // Calculate total tokens for this chat's messages
  const totalTokens = chat.messages.reduce(
    (sum: number, msg: MessagePreview) => sum + (msg.tokens || 0),
    0
  );

  // Estimate latency based on message timestamps (if we have at least 2 messages)
  let estimatedLatency: number | null = null;
  if (chat.messages.length >= 2) {
    const userMsg = chat.messages.find(
      (m: MessagePreview) => m.role === "user"
    );
    const assistantMsg = chat.messages.find(
      (m: MessagePreview) => m.role === "assistant"
    );
    if (userMsg && assistantMsg) {
      const latencyMs =
        new Date(assistantMsg.createdAt).getTime() -
        new Date(userMsg.createdAt).getTime();
      estimatedLatency = latencyMs;
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-2 truncate">
              {chat.title || `Chat ${chat.id.slice(0, 8)}`}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                {messageCount} {messageCount === 1 ? "message" : "messages"}
              </Badge>

              {totalTokens > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {totalTokens.toLocaleString()} tokens
                </Badge>
              )}

              {estimatedLatency !== null && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                  aria-label={`Response latency: ${estimatedLatency} milliseconds`}
                >
                  ⚡ {estimatedLatency}ms
                </Badge>
              )}

              {/* Provider badge - would come from enhanced schema */}
              <Badge variant="default" className="text-xs">
                {process.env.LLM_PROVIDER || "openai"}
              </Badge>
            </div>
          </div>

          <time
            dateTime={chat.updatedAt.toISOString()}
            className="text-sm text-muted-foreground whitespace-nowrap"
          >
            {timeAgo}
          </time>
        </div>
      </CardHeader>

      <CardContent>
        <ol className="space-y-3" role="list" aria-label="Chat messages">
          {chat.messages.map((message: MessagePreview) => (
            <li
              key={message.id}
              className="flex gap-3 items-start"
              role="listitem"
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-foreground border-border"
                }`}
                aria-hidden="true"
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium capitalize">
                    {message.role}
                  </span>
                  <time
                    dateTime={message.createdAt.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </time>
                  {message.tokens && (
                    <Badge variant="outline" className="text-xs">
                      {message.tokens} tokens
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                  {message.content}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {hasMoreMessages && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              + {messageCount - 3} more{" "}
              {messageCount - 3 === 1 ? "message" : "messages"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Generate metadata for the admin page
 */
export const metadata = {
  title: "Admin Dashboard | ChatCanvas",
  description: "Monitor recent conversations and system metrics",
  robots: {
    index: false,
    follow: false,
  },
};
