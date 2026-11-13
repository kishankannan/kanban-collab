"use client";

import { useEffect, useState, useTransition } from "react";
import { getBoardActivities } from "@/actions/activity";

interface Activity {
  id: string;
  actionType: string;
  entityTitle: string;
  createdAt: Date | string;
  user: {
    name: string | null;
    email: string | null; // <-- Allow null for guest accounts
    isGuest: boolean;
  };
}

interface ActivityDrawerProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ACTION_CONFIG: Record<
  string,
  { label: string; badge: string; icon: string }
> = {
  CARD_CREATED: {
    label: "created card",
    badge: "bg-emerald-950/70 text-emerald-400 border-emerald-500/30",
    icon: "＋",
  },
  CARD_UPDATED: {
    label: "updated card",
    badge: "bg-blue-950/70 text-blue-400 border-blue-500/30",
    icon: "✎",
  },
  CARD_DELETED: {
    label: "deleted card",
    badge: "bg-rose-950/70 text-rose-400 border-rose-500/30",
    icon: "🗑",
  },
  CARD_MOVED: {
    label: "moved card",
    badge: "bg-amber-950/70 text-amber-400 border-amber-500/30",
    icon: "⇄",
  },
  COLUMN_CREATED: {
    label: "created column",
    badge: "bg-purple-950/70 text-purple-400 border-purple-500/30",
    icon: "▦",
  },
  COLUMN_DELETED: {
    label: "deleted column",
    badge: "bg-rose-950/70 text-rose-400 border-rose-500/30",
    icon: "✕",
  },
};

export default function ActivityDrawer({
  boardId,
  isOpen,
  onClose,
}: ActivityDrawerProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      startTransition(async () => {
        try {
          const data = await getBoardActivities(boardId);
          setActivities(data);
        } catch (error) {
          console.error("Failed to load activities", error);
        }
      });
    }
  }, [isOpen, boardId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          aria-label="Activity history"
          className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-slate-100">
                Activity Stream
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {activities.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isPending && activities.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                Loading activity history...
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                No recorded actions yet on this board.
              </div>
            ) : (
              activities.map((item) => {
                const config = ACTION_CONFIG[item.actionType] || {
                  label: item.actionType.toLowerCase().replace("_", " "),
                  badge: "bg-slate-800 text-slate-400 border-slate-700",
                  icon: "•",
                };

                const displayName =
                    item.user.name ||
                    (item.user.email ? item.user.email.split("@")[0] : "Guest User");

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-200">
                          {displayName}
                        </span>
                        {item.user.isGuest && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Guest
                          </span>
                        )}
                      </div>
                      <time className="text-[10px] text-slate-500">
                        {formatRelativeTime(item.createdAt)}
                      </time>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${config.badge}`}
                      >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                      <span className="text-slate-300 font-medium truncate max-w-[200px]">
                        &quot;{item.entityTitle}&quot;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}