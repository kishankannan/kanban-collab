import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  // 1. Authenticate user or verify guest session
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // 2. Fetch all workspaces owned by the user (or guest) along with boards & columns
  const workspaces = await prisma.workspace.findMany({
    where: {
      ownerId: currentUser.id,
    },
    include: {
      boards: {
        include: {
          columns: {
            orderBy: { order: "asc" },
            include: {
              cards: {
                select: { id: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold text-lg tracking-tight text-white hover:text-indigo-400 transition-colors">
            Kanban Collab
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm font-medium text-slate-400">Workspaces</span>
        </div>

        {/* User Identity Indicator */}
        <div className="flex items-center gap-3">
          {currentUser.isGuest ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Guest Session: <span className="font-mono">{currentUser.name}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-300 font-medium">
              {currentUser.email ?? currentUser.name}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Guest Banner Notice */}
        {currentUser.isGuest && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-300">
                You are working in an ephemeral guest session
              </p>
              <p className="text-xs text-slate-400">
                Boards and cards created now will be saved for 7 days in this browser. Link an account to keep them permanently.
              </p>
            </div>
            <button
              disabled
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed opacity-80 whitespace-nowrap"
            >
              Upgrade Account (Phase 2)
            </button>
          </div>
        )}

        {/* Workspaces & Boards Section */}
        {workspaces.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
            <h3 className="text-base font-medium text-slate-300">No workspaces found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Create a workspace or launch a new sandbox board to get started.
            </p>
          </div>
        ) : (
          workspaces.map((workspace) => (
            <section key={workspace.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {workspace.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    slug: {workspace.slug}
                  </p>
                </div>
              </div>

              {/* Boards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {workspace.boards.map((board) => {
                  const totalCards = board.columns.reduce(
                    (acc, col) => acc + col.cards.length,
                    0
                  );

                  return (
                    <Link
                      key={board.id}
                      href={`/boards/${board.id}`}
                      className="group block p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: board.color }}
                        />
                        <span className="text-[11px] font-mono text-slate-500">
                          {board.columns.length} columns · {totalCards} cards
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {board.title}
                      </h3>

                      {/* Mini column preview tags */}
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {board.columns.map((col) => (
                          <span
                            key={col.id}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
                          >
                            {col.title}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}