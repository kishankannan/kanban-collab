"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function getBoardActivities(boardId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { workspace: true },
  });

  if (!board || board.workspace.ownerId !== currentUser.id) {
    throw new Error("Forbidden");
  }

  const activities = await prisma.activityLog.findMany({
    where: { boardId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          isGuest: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return activities;
}