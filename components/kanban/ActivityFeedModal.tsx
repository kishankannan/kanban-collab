"use client";

import { useState, useEffect, useTransition } from "react";
import { getBoardActivities } from "@/actions/activity";

interface ActivityItem {
  id: string;
  actionType: string;
  entityTitle: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
    isGuest: boolean;
  };
}

interface ActivityFeedModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivityFeedModal({
  boardId,
  isOpen,
  onClose,
}: ActivityFeedModalProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      startTransition(async () => {
        const data = await getBoardActivities(boardId);
        setActivities(data);
      });
    }
  }, [isOpen, boardId]);

  if (!isOpen) return null;

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case "CARD_CREATED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">CREATED</span>;
      case "CARD_UPDATED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">UPDATED</span>;
      case "CARD_DELETED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">DELETED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">ACTION</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <aside className="relative w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <h3 className="font-semibold text-sm text-slate-100">Audit Activity</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isPending ? (
            <div className="text-center py-10 text-xs text-slate-500">Loading activity feed...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No audit logs recorded yet.
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  {getActionBadge(act.actionType)}
                  <time className="text-[10px] text-slate-500 font-mono">
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </time>
                </div>

                <p className="text-slate-200 font-medium break-words">
                  &ldquo;{act.entityTitle}&rdquo;
                </p>

                <p className="text-[11px] text-slate-500">
                  by <span className="text-slate-400 font-mono">{act.user.name ?? act.user.email}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}