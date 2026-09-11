import type { Metadata } from "next";
import ChatApp from "@/components/chat/ChatApp";

export const metadata: Metadata = {
  title: "Rawchat — App",
  description: "Chat, code and create with any AI model from 30+ providers.",
};

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return <ChatApp />;
}
