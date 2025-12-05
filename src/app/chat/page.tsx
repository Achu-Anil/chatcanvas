import { Metadata } from "next";
import { Suspense } from "react";
import ChatClient from "./ChatClient";

export const metadata: Metadata = {
  title: "Chat - ChatCanvas",
  description: "AI-powered chat interface with streaming responses",
};

function ChatLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading chat...</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingFallback />}>
      <ChatClient />
    </Suspense>
  );
}
