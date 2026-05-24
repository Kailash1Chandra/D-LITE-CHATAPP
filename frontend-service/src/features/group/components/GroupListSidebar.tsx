"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, BellOff, Bell, Check, X } from "lucide-react";
import { Badge } from "@/shared/components/Badge";
import { useGroupList } from "../hooks/use-group-list";
import { useGroupInvites } from "../hooks/use-group-invites";
import { CreateGroupModal } from "./CreateGroupModal";

export function GroupListSidebar() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { groups, loading } = useGroupList();
  const { invites, acceptInvite, declineInvite } = useGroupInvites();
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

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="mx-2 mb-2 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="px-3 py-2 flex items-center gap-2" style={{ background: "var(--row-hover-bg)" }}>
              <Bell size={11} style={{ color: "var(--brand-text)" }} />
              <span className="text-xs font-bold themed-text">
                {invites.length} group invite{invites.length !== 1 ? "s" : ""}
              </span>
            </div>
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="px-3 py-2.5 flex items-center gap-2.5"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="w-8 h-8 rounded-lg brand-grad flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {invite.groupName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold themed-text truncate">{invite.groupName}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>from {invite.invitedBy}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => acceptInvite(invite)}
                    title="Accept"
                    className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                    style={{ background: "rgba(34,197,94,0.3)", color: "var(--success)" }}
                  >
                    <Check size={11} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => declineInvite(invite.id)}
                    title="Decline"
                    className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                    style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
                      {group.isMuted
                        ? <BellOff size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        : group.unreadCount > 0 && <Badge count={group.unreadCount} />}
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
