"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { Badge } from "@/shared/components/Badge";
import { useGroupList } from "../hooks/use-group-list";
import { CreateGroupModal } from "./CreateGroupModal";

export function GroupListSidebar() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { groups, loading } = useGroupList();
  const pathname = usePathname();

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="w-[280px] h-full border-r themed-border themed-surface flex flex-col shrink-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold themed-text">Groups</h2>
            <button
              onClick={() => setCreateOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{ color: "var(--text-muted)" }}
              title="New group"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--brand-text)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg text-[13px] outline-none transition-all"
              style={{
                background: "var(--row-hover-bg)",
                border: "1px solid transparent",
                color: "var(--text-primary)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--brand-text)")}
              onBlur={e => (e.currentTarget.style.borderColor = "transparent")}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {loading ? (
            <div className="text-center text-sm themed-text-3 py-8">Loading...</div>
          ) : filtered.length > 0 ? (
            filtered.map((group) => {
              const isActive = pathname === `/groups/${group.id}`;
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? "bg-[var(--row-active-bg)] border-l-[3px] border-[var(--row-active-border)]" : "hover:bg-[var(--row-hover-bg)]"}`}
                >
                  <div className="w-10 h-10 rounded-xl brand-grad flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {group.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-sm font-semibold themed-text truncate">{group.name}</h4>
                      <span className="text-xs themed-text-3 shrink-0">{group.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm themed-text-3 truncate flex-1">{group.lastMessage}</p>
                      {group.unreadCount > 0 && <Badge count={group.unreadCount} />}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--row-hover-bg)" }}>
                <Plus size={20} style={{ color: "var(--brand-text)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold themed-text mb-0.5">
                  {groups.length === 0 ? "No groups yet" : "No groups found"}
                </p>
                <p className="text-xs themed-text-3">
                  {groups.length === 0 ? "Tap + to create a new group" : "Try a different name"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
