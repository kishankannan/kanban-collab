"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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
}: {
  cardId: string;
  boardId: string;
  title: string;
  description?: string | null;
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