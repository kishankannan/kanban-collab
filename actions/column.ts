"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function createColumn(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  const boardId = formData.get("boardId") as string;
  const title = (formData.get("title") as string)?.trim();

  if (!boardId || !title) throw new Error("Missing title or boardId");

  // Verify ownership
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { workspace: true },
  });

  if (!board || board.workspace.ownerId !== currentUser.id) {
    throw new Error("Forbidden");
  }

  // Calculate next fractional order for column
  const lastColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const nextOrder = lastColumn ? lastColumn.order + 1000 : 1000;

  await prisma.column.create({
    data: {
      title,
      boardId,
      order: nextOrder,
    },
  });

  revalidatePath(`/boards/${boardId}`);
}

export async function deleteColumn(columnId: string, boardId: string) {
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

  await prisma.column.delete({
    where: { id: columnId },
  });

  revalidatePath(`/boards/${boardId}`);
}

export async function moveColumn({
  columnId,
  newOrder,
  boardId,
}: {
  columnId: string;
  newOrder: number;
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

  await prisma.column.update({
    where: { id: columnId },
    data: {
      order: newOrder,
    },
  });

  revalidatePath(`/boards/${boardId}`);
}