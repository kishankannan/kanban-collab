"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Priority } from "@prisma/client";

export async function createCard(formData: FormData) {
  // 1. Authenticate session
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const columnId = formData.get("columnId") as string;
  const boardId = formData.get("boardId") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  // --- NEW: Extract and validate priority ---
  const priorityRaw = formData.get("priority") as string;
  const priority = Object.values(Priority).includes(priorityRaw as Priority)
    ? (priorityRaw as Priority)
    : Priority.MEDIUM;
  // ------------------------------------------

  if (!columnId || !boardId || !title) {
    throw new Error("Missing required fields");
  }

  // 2. Verify user owns the board's workspace
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { workspace: true },
  });

  if (!board || board.workspace.ownerId !== currentUser.id) {
    throw new Error("Forbidden: You do not own this board");
  }

  // 3. Compute Fractional Order (Append to bottom of the column)
  const lastCard = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  // Default gap is 1000.0, allowing future mid-point splits (e.g. 1500.0)
  const nextOrder = lastCard ? lastCard.order + 1000 : 1000;

  // 4. Create Card & Record Activity Log
  await prisma.$transaction(async (tx) => {
    const card = await tx.card.create({
      data: {
        title,
        description,
        columnId,
        order: nextOrder,
        priority,
      },
    });

    await tx.activityLog.create({
      data: {
        boardId,
        userId: currentUser.id,
        actionType: "CARD_CREATED",
        entityTitle: title,
      },
    });

    return card;
  });

  // 5. Revalidate the board detail view cache
  revalidatePath(`/boards/${boardId}`);
}

export async function moveCard({
  cardId,
  targetColumnId,
  newOrder,
  boardId,
}: {
  cardId: string;
  targetColumnId: string;
  newOrder: number;
  boardId: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  // Verify ownership
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { workspace: true },
  });

  if (!board || board.workspace.ownerId !== currentUser.id) {
    throw new Error("Forbidden");
  }

  // Update card position in Neon
  await prisma.card.update({
    where: { id: cardId },
    data: {
      columnId: targetColumnId,
      order: newOrder,
    },
  });

  revalidatePath(`/boards/${boardId}`);
}

export async function updateCard({
  cardId,
  boardId,
  title,
  description,
  priority, // 1. Destructure priority
}: {
  cardId: string;
  boardId: string;
  title: string;
  description?: string | null;
  priority?: Priority; // 2. Add optional TypeScript type
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { workspace: true },
  });

  if (!board || board.workspace.ownerId !== currentUser.id) {
    throw new Error("Forbidden");
  }

  await prisma.$transaction(async (tx) => {
    await tx.card.update({
      where: { id: cardId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        ...(priority !== undefined ? { priority } : {}), // 3. Update priority if provided
      },
    });

    await tx.activityLog.create({
      data: {
        boardId,
        userId: currentUser.id,
        actionType: "CARD_UPDATED",
        entityTitle: title.trim(),
      },
    });
  });

  revalidatePath(`/boards/${boardId}`);
}

export async function deleteCard({
  cardId,
  boardId,
}: {
  cardId: string;
  boardId: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { workspace: true },
  });

  if (!board || board.workspace.ownerId !== currentUser.id) {
    throw new Error("Forbidden");
  }

  const existingCard = await prisma.card.findUnique({
    where: { id: cardId },
    select: { title: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.card.delete({
      where: { id: cardId },
    });

    if (existingCard) {
      await tx.activityLog.create({
        data: {
          boardId,
          userId: currentUser.id,
          actionType: "CARD_DELETED",
          entityTitle: existingCard.title,
        },
      });
    }
  });

  revalidatePath(`/boards/${boardId}`);
}

export async function rebalanceColumnCards(columnId: string, boardId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  // Fetch all cards in the column sorted by their current order
  const cards = await prisma.card.findMany({
    where: { columnId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  // Re-space them using increments of 1000 (1000, 2000, 3000, ...)
  await prisma.$transaction(
    cards.map((card, index) =>
      prisma.card.update({
        where: { id: card.id },
        data: { order: (index + 1) * 1000 },
      })
    )
  );

  revalidatePath(`/boards/${boardId}`);
}