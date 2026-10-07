"use client";

import { useState, useRef, useTransition } from "react";
import { createCard } from "@/actions/card";

interface AddCardFormProps {
  columnId: string;
  boardId: string;
}

export default function AddCardForm({ columnId, boardId }: AddCardFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-3 w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg border border-dashed border-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span className="font-semibold text-sm leading-none">+</span>
        <span>Add Card</span>
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData: FormData) => {
        startTransition(async () => {
          await createCard(formData);
          formRef.current?.reset();
          setIsOpen(false);
        });
      }}
      className="mt-3 space-y-2 bg-slate-800/70 p-3 rounded-lg border border-slate-700/80 shadow-md"
    >
      <input type="hidden" name="columnId" value={columnId} />
      <input type="hidden" name="boardId" value={boardId} />

      <input
        type="text"
        name="title"
        required
        autoFocus
        placeholder="Card title..."
        disabled={isPending}
        className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
      />

      <textarea
        name="description"
        rows={2}
        placeholder="Add details (optional)..."
        disabled={isPending}
        className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
      />

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors cursor-pointer"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setIsOpen(false)}
          className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}