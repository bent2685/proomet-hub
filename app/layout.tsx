import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "proomet-hub",
  description: "Aggregate, browse, and discover prompts across git sources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-7xl px-4 pt-6 pb-24">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
