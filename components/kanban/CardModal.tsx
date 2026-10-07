"use client";

import { useState, useTransition } from "react";
import { updateCard, deleteCard } from "@/actions/card";

interface CardModalProps {
  card: {
    id: string;
    title: string;
    description: string | null;
    order: number;
  };
  boardId: string;
  columnTitle: string;
  onClose: () => void;
}

export default function CardModal({
  card,
  boardId,
  columnTitle,
  onClose,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await updateCard({
        cardId: card.id,
        boardId,
        title,
        description,
      });
      onClose();
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    startTransition(async () => {
      await deleteCard({
        cardId: card.id,
        boardId,
      });
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="fixed inset-0"
        onClick={() => !isPending && onClose()}
      />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 z-10 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400">
              in column: {columnTitle}
            </span>
            <span className="block text-[10px] font-mono text-slate-500">
              order: {card.order.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              disabled={isPending}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              disabled={isPending}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, notes, or acceptance criteria..."
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              Delete Card
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}