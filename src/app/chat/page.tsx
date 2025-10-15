import { Metadata } from "next";
import ChatClient from "./ChatClient";

export const metadata: Metadata = {
  title: "Chat - ChatCanvas",
  description: "AI-powered chat interface with streaming responses",
};

export default function ChatPage() {
  return <ChatClient />;
}
