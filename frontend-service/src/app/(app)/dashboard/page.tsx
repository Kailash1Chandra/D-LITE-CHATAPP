import { Suspense } from "react";
import { Greeting } from "@/features/dashboard/components/Greeting";
import { StatRow } from "@/features/dashboard/components/StatRow";
import { RecentChatsGrid } from "@/features/dashboard/components/RecentChatsGrid";
import { RecentCallsServer } from "@/features/dashboard/components/RecentCallsServer";
import { FavouriteChats } from "@/features/dashboard/components/FavouriteChats";
import { getUser } from "@/core/auth/get-user";

// ── Skeletons ──────────────────────────────────────────────────────────────────
function CardSkeleton({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`} style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="h-5 w-32 rounded-lg animate-pulse" style={{ background: "var(--row-hover-bg)" }} />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full animate-pulse shrink-0" style={{ background: "var(--row-hover-bg)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--row-hover-bg)", width: `${60 + (i % 3) * 15}%` }} />
              <div className="h-2.5 rounded animate-pulse" style={{ background: "var(--row-hover-bg)", width: `${40 + (i % 2) * 20}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "var(--surface)", border: "1px solid var(--border)", height: 120 }}>
          <div className="w-10 h-10 rounded-xl mb-4" style={{ background: "var(--row-hover-bg)" }} />
          <div className="h-7 w-16 rounded mb-1" style={{ background: "var(--row-hover-bg)" }} />
          <div className="h-3 w-24 rounded" style={{ background: "var(--row-hover-bg)" }} />
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const user = await getUser();
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const firstName = fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero renders immediately — no data needed */}
      <Greeting name={firstName} />

      {/* Stats stream in independently */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatRow />
      </Suspense>

      {/* Favourite chats — client component, renders only if user has favourites */}
      <FavouriteChats />

      {/* Chats + Calls stream in parallel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <Suspense fallback={<CardSkeleton rows={5} />}>
          <RecentChatsGrid />
        </Suspense>
        <Suspense fallback={<CardSkeleton rows={5} />}>
          <RecentCallsServer />
        </Suspense>
      </div>
    </div>
  );
}
