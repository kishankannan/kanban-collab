"use client";

import { useState, useRef, useTransition } from "react";
import { createColumn } from "@/actions/column";

interface AddColumnFormProps {
  boardId: string;
}

export default function AddColumnForm({ boardId }: AddColumnFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!isOpen) {
    return (
      <div className="w-80 shrink-0">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full h-12 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>+</span> Add Another Column
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 shrink-0 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg">
      <form
        ref={formRef}
        action={(formData: FormData) => {
          startTransition(async () => {
            await createColumn(formData);
            formRef.current?.reset();
            setIsOpen(false);
          });
        }}
        className="space-y-3"
      >
        <input type="hidden" name="boardId" value={boardId} />
        <input
          type="text"
          name="title"
          required
          autoFocus
          placeholder="Column title (e.g. In Review)..."
          disabled={isPending}
          className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors cursor-pointer"
          >
            {isPending ? "Adding..." : "Add Column"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setIsOpen(false)}
            className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}