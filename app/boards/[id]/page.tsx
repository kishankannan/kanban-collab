import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import BoardHeader from "./BoardHeader";

export const dynamic = "force-dynamic";

interface BoardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BoardDetailPage({ params }: BoardPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  const { id: boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: true,
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!board) notFound();
  if (board.workspace.ownerId !== currentUser.id) redirect("/boards");

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <BoardHeader board={board} currentUser={currentUser} />

      <main className="flex-1 overflow-x-auto p-6">
        <KanbanBoard boardId={board.id} initialColumns={board.columns} />
      </main>
    </div>
  );
}