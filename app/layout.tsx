import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Notebook",
  description: "Markdown notes and browser JavaScript practice workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
