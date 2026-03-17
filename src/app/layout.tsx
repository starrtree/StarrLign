import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "StarrLign - Personal Focus OS",
  description: "A personal project manager and focus tracking system",
  keywords: ["productivity", "project manager", "focus", "tasks"],
  authors: [{ name: "StarrLign" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
