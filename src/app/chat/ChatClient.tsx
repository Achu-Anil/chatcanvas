"use client";

import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  useOptimistic,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { enabled, FeatureFlags } from "@/lib/featureFlags";
import { ThemeToggle } from "@/components/theme-toggle";
import { trackEvent } from "@/lib/posthog.client";
import {
  Send,
  ChevronDown,
  Copy,
  Check,
  Trash2,
  User,
  Bot,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  pending?: boolean;
}

interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "explain",
    label: "Explain this concept",
    prompt: "Explain the following concept in simple terms: ",
  },
  {
    id: "summarize",
    label: "Summarize",
    prompt: "Summarize the following text: ",
  },
  {
    id: "improve",
    label: "Improve writing",
    prompt:
      "Improve the following text to make it more clear and professional: ",
  },
  {
    id: "debug",
    label: "Debug code",
    prompt: "Help me debug this code and explain what's wrong: ",
  },
  {
    id: "translate",
    label: "Translate",
    prompt: "Translate the following text to Spanish: ",
  },
];

interface ChatClientProps {
  chatId?: string;
  initialMessages?: Message[];
}

export default function ChatClient({
  chatId: initialChatId,
  initialMessages = [],
}: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [chatId] = useState(
    initialChatId ||
      `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleClearChat = () => {
    if (messages.length === 0) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear all messages? This action cannot be undone."
    );

    if (confirmed) {
      setMessages([]);
      setStreamingContent("");
    }
  };

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [optimisticMessages, streamingContent]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
      pending: true,
    };

    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Optimistically add message
    addOptimisticMessage(userMessage);

    // Actually add to state after optimistic update
    setMessages((prev) => [...prev, userMessage]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Track chat started event
    const startTime = Date.now();
    trackEvent("chat_started", {
      chatId,
      messageLength: trimmedInput.length,
      messageCount: messages.length + 1,
    });

    try {
      // Create abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (!reader) {
        throw new Error("No response body");
      }

      // Extract provider from response headers
      const provider = response.headers.get("X-Provider") || "unknown";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const text = decoder.decode(value, { stream: true });
        accumulatedContent += text;
        setStreamingContent(accumulatedContent);
      }

      // Calculate latency
      const latency = Date.now() - startTime;

      // Add the completed message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: accumulatedContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");

      // Track chat completed event
      trackEvent("chat_completed", {
        chatId,
        provider,
        latency,
        responseLength: accumulatedContent.length,
        messageCount: messages.length + 2,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("Request aborted");
          return;
        }
        console.error("Error sending message:", error);

        // Calculate latency even for errors
        const latency = Date.now() - startTime;

        // Track chat error event
        trackEvent("chat_error", {
          chatId,
          error: error.message,
          errorType: error.name,
          latency,
          messageCount: messages.length + 1,
        });

        // Show error message
        const errorMessage: Message = {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: `Error: ${error.message}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTemplateSelect = (template: PromptTemplate) => {
    setInput(template.prompt);
    textareaRef.current?.focus();
    // Move cursor to end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 0);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const showTemplates = enabled(FeatureFlags.TEMPLATES);
  const showDarkMode = enabled(FeatureFlags.DARK_MODE);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with Theme Toggle and Clear Chat Button */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold">Chat</h1>
          <div className="flex items-center gap-2">
            {showDarkMode && <ThemeToggle />}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label="Clear chat"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-3xl mx-auto">
          {optimisticMessages.length === 0 && !streamingContent && (
            <div className="text-center text-muted-foreground py-12">
              <h2 className="text-2xl font-semibold mb-2">
                Start a conversation
              </h2>
              <p className="text-sm">
                Type a message below or select a template to get started.
              </p>
            </div>
          )}

          {optimisticMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isStreaming && !streamingContent && <LoadingShimmer />}

          {streamingContent && (
            <MessageBubble
              message={{
                id: "streaming",
                role: "assistant",
                content: streamingContent,
                timestamp: new Date(),
              }}
              isStreaming
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Composer */}
      <div className="border-t bg-background sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-end">
              {/* Template Dropdown */}
              {showTemplates && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={isStreaming}
                      aria-label="Select prompt template"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {PROMPT_TEMPLATES.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        {template.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Textarea */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... (Cmd+Enter to send)"
                  className="min-h-[60px] max-h-[200px] resize-none pr-12"
                  disabled={isStreaming}
                  rows={1}
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="shrink-0 h-[60px] w-[60px]"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            {/* Keyboard hint */}
            <div className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded">⌘</kbd> +{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd> to
              send
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <div
      className={cn(
        "flex gap-3 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full border-2",
          isUser
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-foreground border-border"
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Timestamp */}
        {message.timestamp && (
          <div className="text-xs text-muted-foreground px-1">
            {formatTime(message.timestamp)}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            "rounded-lg px-4 py-3 relative group/message",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </div>

          {/* Copy Button */}
          {!isStreaming && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className={cn(
                "absolute -top-2 opacity-0 group-hover/message:opacity-100 transition-opacity h-7 w-7",
                isUser ? "-left-2" : "-right-2",
                isUser
                  ? "hover:bg-primary-foreground/20 text-primary-foreground"
                  : "hover:bg-muted-foreground/20"
              )}
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingShimmer() {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full border-2 bg-background text-foreground border-border">
        <Bot className="h-5 w-5" />
      </div>

      {/* Shimmer Content */}
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className="rounded-lg bg-muted px-4 py-3 space-y-2">
          <div className="h-4 bg-muted-foreground/20 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted-foreground/20 rounded animate-pulse w-full" />
          <div className="h-4 bg-muted-foreground/20 rounded animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}
