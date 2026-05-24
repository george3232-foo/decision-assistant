"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const EXAMPLES = [
  "Should I buy an iPhone 18 or Samsung S30? Camera matters a lot and budget is around ₹70,000",
  "Should I move to Bangalore for a new job? Currently in Mumbai earning well",
  "MBA vs continuing my current job? I'm 27 with 4 years of experience",
  "Rent vs Buy a house? Budget is ₹50L, planning to stay 5+ years",
];

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");

    try {
      const result = await api.analyze(input.trim());
      router.push(`/analysis/${result.decision_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full text-center fade-in">
          {/* Logo mark */}
          <div className="mx-auto mb-8 w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-indigo-400"
            >
              <path d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            Make better decisions
            <br />
            with structured AI reasoning
          </h1>

          <p className="text-slate-400 text-lg mb-10">
            Describe your decision in plain language. Get weighted analysis,
            tradeoffs, and recommendations — backed by deterministic math.
          </p>

          {/* Input card */}
          <div className="glass-card p-6 text-left">
            <textarea
              className="input-glass min-h-[120px] mb-4"
              placeholder="Describe your decision... e.g. Should I buy an iPhone or Samsung? Camera matters a lot, budget around ₹70,000"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAnalyze();
                }
              }}
            />

            {error && (
              <p className="text-red-400 text-sm mb-3">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Ctrl+Enter to analyze
              </span>
              <button
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Decision"
                )}
              </button>
            </div>
          </div>

          {/* Examples */}
          <div className="mt-10">
            <p className="text-sm text-slate-500 mb-4">Try an example</p>
            <div className="grid gap-3">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className="glass-card p-4 text-left text-sm text-slate-300 hover:text-white cursor-pointer"
                  onClick={() => setInput(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-600 border-t border-white/[0.05]">
        Decision Assistant — Deterministic scoring, AI-powered reasoning
      </footer>
    </div>
  );
}
