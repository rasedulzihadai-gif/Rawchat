import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rawchat — Every AI model. One raw interface.",
  description:
    "Chat, code and create with 480+ AI models from 30+ providers — free and paid — through one Claude-grade interface. Bring your own keys.",
};

export const viewport: Viewport = {
  themeColor: "#151412",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
