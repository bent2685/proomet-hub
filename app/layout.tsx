import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "proomet-hub",
  description: "Aggregate, browse, and discover prompts across git sources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased flex flex-col">
        <Providers>
          <Header />
          <main className="mx-auto max-w-7xl w-full px-4 pt-6 pb-16 flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
