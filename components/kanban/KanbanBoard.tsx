"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import AddCardForm from "./AddCardForm";
import AddColumnForm from "./AddColumnForm";
import ColumnActions from "./ColumnActions";
import { moveCard } from "@/actions/card";
import { moveColumn } from "@/actions/column";
import CardModal, { PRIORITY_STYLES } from "./CardModal";
import { Priority } from "@prisma/client";

interface CardItem {
  id: string;
  title: string;
  description: string | null;
  order: number;
  priority?: Priority; // 1. Added optional Priority property
}

interface ColumnItem {
  id: string;
  title: string;
  order: number;
  cards: CardItem[];
}

interface KanbanBoardProps {
  boardId: string;
  initialColumns: ColumnItem[];
}

export default function KanbanBoard({
  boardId,
  initialColumns,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns);
  const [, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Priority | "ALL">("ALL");
  const [activeCardData, setActiveCardData] = useState<{
    card: CardItem;
    columnTitle: string;
  } | null>(null);

  const filteredColumns = useMemo(() => {
  const query = searchQuery.trim().toLowerCase();

  return columns.map((col) => ({
    ...col,
    cards: col.cards.filter((card) => {
      const matchesSearch =
        !query ||
        card.title.toLowerCase().includes(query) ||
        (card.description?.toLowerCase().includes(query) ?? false);

      const matchesPriority =
        selectedPriority === "ALL" ||
        (card.priority || Priority.MEDIUM) === selectedPriority;

      return matchesSearch && matchesPriority;
    }),
  }));
}, [columns, searchQuery, selectedPriority]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // ----------------------------------------------------
    // CASE A: Reordering entire Columns horizontally
    // ----------------------------------------------------
    if (type === "column") {
      const nextColumns = [...columns];
      const [movedColumn] = nextColumns.splice(source.index, 1);
      nextColumns.splice(destination.index, 0, movedColumn);

      // Fractional calculation for columns
      let calculatedOrder: number;
      if (nextColumns.length === 1) {
        calculatedOrder = 1000;
      } else if (destination.index === 0) {
        calculatedOrder = nextColumns[1].order / 2;
      } else if (destination.index === nextColumns.length - 1) {
        calculatedOrder = nextColumns[destination.index - 1].order + 1000;
      } else {
        const prevOrder = nextColumns[destination.index - 1].order;
        const nextOrder = nextColumns[destination.index + 1].order;
        calculatedOrder = (prevOrder + nextOrder) / 2;
      }

      movedColumn.order = calculatedOrder;
      setColumns(nextColumns);

      startTransition(async () => {
        await moveColumn({
          columnId: draggableId,
          newOrder: calculatedOrder,
          boardId,
        });
      });
      return;
    }

    // ----------------------------------------------------
    // CASE B: Reordering Cards (within or across columns)
    // ----------------------------------------------------
    const sourceCol = columns.find((c) => c.id === source.droppableId);
    const destCol = columns.find((c) => c.id === destination.droppableId);
    if (!sourceCol || !destCol) return;

    const nextColumns = columns.map((col) => ({
      ...col,
      cards: [...col.cards],
    }));

    const nextSourceCards = nextColumns.find((c) => c.id === source.droppableId)!.cards;
    const nextDestCards = nextColumns.find((c) => c.id === destination.droppableId)!.cards;

    const [movedCard] = nextSourceCards.splice(source.index, 1);
    nextDestCards.splice(destination.index, 0, movedCard);

    let calculatedOrder: number;
    if (nextDestCards.length === 1) {
      calculatedOrder = 1000;
    } else if (destination.index === 0) {
      calculatedOrder = nextDestCards[1].order / 2;
    } else if (destination.index === nextDestCards.length - 1) {
      calculatedOrder = nextDestCards[destination.index - 1].order + 1000;
    } else {
      const prevOrder = nextDestCards[destination.index - 1].order;
      const nextOrder = nextDestCards[destination.index + 1].order;
      calculatedOrder = (prevOrder + nextOrder) / 2;
    }

    movedCard.order = calculatedOrder;
    setColumns(nextColumns);

    startTransition(async () => {
      await moveCard({
        cardId: draggableId,
        targetColumnId: destination.droppableId,
        newOrder: calculatedOrder,
        boardId,
      });
    });
  };

  return (
    <div className="space-y-4">
      {/* ------------------------- ADD THIS FILTER BAR ------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl backdrop-blur-sm">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input
            type="text"
            placeholder="Search cards by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Priority Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedPriority("ALL")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedPriority === "ALL"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            All
          </button>
          {(Object.keys(PRIORITY_STYLES) as Priority[]).map((p) => {
            const isSelected = selectedPriority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPriority(isSelected ? "ALL" : p)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  isSelected
                    ? `${PRIORITY_STYLES[p].bg} ${PRIORITY_STYLES[p].text}${PRIORITY_STYLES[p].border} ring-1 ring-white/20`
                    : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {PRIORITY_STYLES[p].label}
              </button>
            );
          })}
        </div>
      </div>
      {/* ------------------------------------------------------------------------ */}
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable
        droppableId="board-columns"
        direction="horizontal"
        type="column"
      >
        {(boardProvided) => (
          <div
            ref={boardProvided.innerRef}
            {...boardProvided.droppableProps}
            className="flex items-start gap-6 min-w-max pb-8"
          >
            {filteredColumns.map((column, colIndex) => (
              <Draggable
                key={column.id}
                draggableId={column.id}
                index={colIndex}
              >
                {(colProvided, colSnapshot) => (
                  <div
                    ref={colProvided.innerRef}
                    {...colProvided.draggableProps}
                    className={`w-80 flex flex-col rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 shadow-lg backdrop-blur-sm transition-shadow ${
                      colSnapshot.isDragging
                        ? "ring-2 ring-indigo-500 shadow-2xl bg-slate-900"
                        : ""
                    }`}
                  >
                    {/* Column Header */}
                    <div
                      {...colProvided.dragHandleProps}
                      className="flex items-center justify-between pb-3 border-b border-slate-800 cursor-grab active:cursor-grabbing select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">⋮⋮</span>
                        <h2 className="font-semibold text-sm text-slate-200">
                          {column.title}
                        </h2>
                        <span className="text-xs bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
                          {column.cards.length}
                        </span>
                      </div>
                      <ColumnActions columnId={column.id} boardId={boardId} />
                    </div>

                    {/* Droppable Card Area */}
                    <Droppable droppableId={column.id} type="card">
                      {(cardProvided, cardSnapshot) => (
                        <div
                          ref={cardProvided.innerRef}
                          {...cardProvided.droppableProps}
                          className={`flex-1 mt-3 space-y-2.5 min-h-[150px] rounded-lg transition-colors ${
                            cardSnapshot.isDraggingOver
                              ? "bg-slate-800/30 ring-1 ring-indigo-500/30"
                              : ""
                          }`}
                        >
                          {column.cards.map((card, cardIndex) => (
                            <Draggable
                              key={card.id}
                              draggableId={card.id}
                              index={cardIndex}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() =>
                                    setActiveCardData({
                                      card,
                                      columnTitle: column.title,
                                    })
                                  }
                                  className={`p-3.5 rounded-lg bg-slate-800/90 border border-slate-700/60 shadow-sm transition-all space-y-1.5 cursor-pointer ${
                                    dragSnapshot.isDragging
                                      ? "ring-2 ring-indigo-500 shadow-xl bg-slate-800 opacity-95"
                                      : "hover:border-slate-500"
                                  }`}
                                >
                                  {/* 2. Priority Badge Pill */}
                                  {card.priority && (
                                    <div className="flex items-center mb-1">
                                      <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                          PRIORITY_STYLES[card.priority]?.bg ?? "bg-slate-800"
                                        } ${
                                          PRIORITY_STYLES[card.priority]?.text ?? "text-slate-300"
                                        } ${
                                          PRIORITY_STYLES[card.priority]?.border ?? "border-slate-700"
                                        }`}
                                      >
                                        {PRIORITY_STYLES[card.priority]?.label ?? card.priority}
                                      </span>
                                    </div>
                                  )}

                                  <p className="text-sm font-medium text-slate-100">
                                    {card.title}
                                  </p>
                                  {card.description && (
                                    <p className="text-xs text-slate-400 line-clamp-2">
                                      {card.description}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] font-mono text-slate-500">
                                      order: {card.order.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {cardProvided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    <AddCardForm columnId={column.id} boardId={boardId} />
                  </div>
                )}
              </Draggable>
            ))}
            {boardProvided.placeholder}

            <AddColumnForm boardId={boardId} />
          </div>
        )}
      </Droppable>

      {activeCardData && (
        <CardModal
          card={activeCardData.card}
          boardId={boardId}
          columnTitle={activeCardData.columnTitle}
          onClose={() => setActiveCardData(null)}
        />
      )}
    </DragDropContext>
  </div>
  );
}