import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transparent Glasshouse — WebMCP Edition",
  description:
    "A shared creative constellation where people and AI agents explore Bloom Cards and compose Wonder Routes together.",
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
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
