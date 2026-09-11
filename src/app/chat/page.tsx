import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ChatApp from "@/components/chat/ChatApp";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Rawchat — App",
  description: "Chat, code and create with any AI model from 30+ providers.",
};

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ChatApp initialUser={{ email: user.email }} />;
}
