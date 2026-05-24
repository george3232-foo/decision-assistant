import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision Assistant",
  description: "AI-powered structured reasoning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-sm">
                D
              </span>
              Decision Assistant
            </a>
            <div className="flex items-center gap-6">
              <a
                href="/"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                New Decision
              </a>
              <a
                href="/history"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                History
              </a>
            </div>
          </div>
        </nav>
        <main className="pt-16 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
