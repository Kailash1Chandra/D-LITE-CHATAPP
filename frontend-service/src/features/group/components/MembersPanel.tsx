"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, UserPlus, UserMinus, Ban } from "lucide-react";
import { User } from "@/features/dashboard/lib/mock-data";
import { Avatar } from "@/shared/components/Avatar";
import { RoleBadge } from "./RoleBadge";
import { AddMemberModal } from "./AddMemberModal";
import { useToast } from "@/shared/components/Toast";
import { createClient } from "@/core/auth/supabase-client";

const supabase = createClient();
type MemberRole = "owner" | "admin" | "mod" | "member";

export interface MembersPanelProps {
  members: (User & { role?: MemberRole })[];
  groupId: string;
  currentUserId?: string;
  currentUserRole?: MemberRole;
  onMembersChange?: () => void;
}

export function MembersPanel({ members, groupId, currentUserId, currentUserRole, onMembersChange }: MembersPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";
  const online = members.filter((m) => m.isOnline);
  const offline = members.filter((m) => !m.isOnline);
  const existingIds = members.map((m) => m.id);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  async function removeMember(member: User & { role?: MemberRole }) {
    setMenuFor(null);
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", member.id);
    if (error) {
      toast({ title: "Couldn't remove member", description: error.message, type: "error" });
    } else {
      toast({ title: "Member removed", description: `${member.name} has been removed`, type: "info" });
      onMembersChange?.();
    }
  }

  async function blockUser(member: User) {
    if (!currentUserId) return;
    setMenuFor(null);
    const { error } = await supabase
      .from("blocked_users")
      .insert({ blocker_id: currentUserId, blocked_id: member.id });
    if (error?.code === "23505") {
      toast({ title: "Already blocked", description: `${member.name} is already blocked`, type: "info" });
    } else if (error) {
      toast({ title: "Couldn't block user", type: "error" });
    } else {
      toast({ title: "User blocked", description: `${member.name} has been blocked`, type: "info" });
    }
  }

  const renderMember = (m: User & { role?: MemberRole }) => {
    const isSelf = m.id === currentUserId;
    const menuOpen = menuFor === m.id;

    return (
      <div key={m.id} className="relative flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-[var(--row-hover-bg)] -mx-2 transition-colors group">
        <Avatar initials={m.initials} online={m.isOnline} size="sm" />
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-semibold themed-text truncate">
            {m.name}
            {isSelf && <span className="text-xs font-normal ml-1" style={{ color: "var(--text-muted)" }}>(you)</span>}
          </h5>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {m.isOnline ? "Online" : "Offline"}
          </div>
        </div>
        {m.role && m.role !== "member" && <RoleBadge role={m.role} />}

        {!isSelf && (
          <button
            onClick={() => setMenuFor(menuOpen ? null : m.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
            style={{ color: "var(--text-muted)" }}
          >
            <MoreVertical size={14} />
          </button>
        )}

        {menuOpen && !isSelf && (
          <div ref={menuRef} className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl overflow-hidden shadow-xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {canManage && m.role !== "owner" && (
              <button
                onClick={() => removeMember(m)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                style={{ color: "var(--danger)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <UserMinus size={14} /> Remove from group
              </button>
            )}
            <button
              onClick={() => blockUser(m)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm themed-text transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = "var(--row-hover-bg)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Ban size={14} /> Block user
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="w-[220px] h-full flex flex-col shrink-0"
        style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-bold themed-text text-sm">Members ({members.length})</h3>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--brand-text)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
              title="Add member"
            >
              <UserPlus size={14} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="mb-6">
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Online — {online.length}
            </h4>
            <div className="space-y-0.5">{online.map(renderMember)}</div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Offline — {offline.length}
            </h4>
            <div className="space-y-0.5">{offline.map(renderMember)}</div>
          </div>
        </div>
      </div>

      <AddMemberModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        groupId={groupId}
        existingMemberIds={existingIds}
        onAdded={onMembersChange}
      />
    </>
  );
}
