import React from "react";
import { KanbanColumnProps } from "@/types/kanban";

export default function Column({ id, title, cardCount = 0 }: KanbanColumnProps) {
  return (
    <div
      id={id}
      className="flex flex-col w-80 min-h-[500px] rounded-xl bg-slate-900/60 border border-slate-800 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h2 className="font-semibold text-slate-200 text-sm tracking-wide">
          {title}
        </h2>
        <span className="text-xs bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
          {cardCount}
        </span>
      </div>

      <div className="flex-1 mt-4 space-y-3">
        {/* Task cards will be dropped here */}
        <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center text-xs text-slate-500">
          No cards yet
        </div>
      </div>
    </div>
  );
}