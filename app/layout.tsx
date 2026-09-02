import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transparent Glasshouse — WebMCP Edition",
  description:
    "A draggable transparent workspace where people and AI agents explore Bloom Cards, compose Wonder Routes, and shape one shared atmosphere.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
