"use client";

import { useState, useTransition } from "react";
import { deleteColumn } from "@/actions/column";

interface ColumnActionsProps {
  columnId: string;
  boardId: string;
}

export default function ColumnActions({ columnId, boardId }: ColumnActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Are you sure? All cards in this column will be permanently deleted.")) {
      return;
    }
    startTransition(async () => {
      await deleteColumn(columnId, boardId);
      setIsOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-500 hover:text-slate-300 text-xs px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
      >
        •••
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-6 z-30 w-36 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1 text-xs">
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="w-full text-left px-2.5 py-1.5 rounded text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Delete Column"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}