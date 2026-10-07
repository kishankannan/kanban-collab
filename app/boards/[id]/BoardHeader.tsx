"use client";

import { useState } from "react";
import Link from "next/link";
import ActivityFeedModal from "@/components/kanban/ActivityFeedModal";

interface BoardHeaderProps {
  board: {
    id: string;
    title: string;
    color: string;
  };
  currentUser: {
    name: string | null;
    email: string | null;
    isGuest: boolean;
  };
}

export default function BoardHeader({ board, currentUser }: BoardHeaderProps) {
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/boards"
            className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Workspaces
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: board.color }}
            />
            <h1 className="text-base font-bold text-white tracking-tight">
              {board.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActivityOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs text-slate-300 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Activity Log
          </button>

          {currentUser.isGuest ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Guest Mode
            </div>
          ) : (
            <span className="text-xs text-slate-300 font-medium">
              {currentUser.email ?? currentUser.name}
            </span>
          )}
        </div>
      </header>

      <ActivityFeedModal
        boardId={board.id}
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />
    </>
  );
}