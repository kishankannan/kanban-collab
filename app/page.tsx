export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Day 3 Milestone • Stack Initialized
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Collaborative <span className="text-blue-500">Kanban</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Zero-friction task management with multi-auth, real-time sync, and fractional-index drag & drop.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md transition-colors">
            Continue as Guest
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors">
            Sign In with OAuth
          </button>
        </div>
      </div>
    </main>
  );
}