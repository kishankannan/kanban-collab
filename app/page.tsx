"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGuestAccess() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        router.push("/boards");
      } else {
        alert("Failed to create guest session.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error creating guest session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-100">
      <div className="max-w-md w-full space-y-6 bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur">
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            Multi-Tier Authentication
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Kanban Collab
          </h1>
          <p className="text-sm text-slate-400">
            Real-time, persistent boards for agile engineering teams.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleGuestAccess}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            {loading ? "Creating Guest Workspace..." : "Try as Guest (Instant Access)"}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-wider">
              or
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            disabled
            className="w-full py-3 px-4 rounded-lg bg-slate-800/60 text-slate-400 font-medium text-sm cursor-not-allowed border border-slate-700/50"
          >
            Sign In with GitHub (OAuth)
          </button>
        </div>
      </div>
    </main>
  );
}