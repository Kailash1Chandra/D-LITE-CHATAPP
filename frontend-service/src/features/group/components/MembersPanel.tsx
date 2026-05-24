"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, UserPlus, UserMinus, Ban, Clock, X } from "lucide-react";
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

interface PendingInvite {
  id: string;
  userId: string;
  name: string;
  initials: string;
}

export function MembersPanel({ members, groupId, currentUserId, currentUserRole, onMembersChange }: MembersPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  // Load pending invites for the group (visible to owner/admin only)
  useEffect(() => {
    if (!canManage) return;
    async function loadPending() {
      const { data: inviteRows } = await supabase
        .from("group_invites")
        .select("id, invited_user_id")
        .eq("group_id", groupId)
        .eq("status", "pending");
      if (!inviteRows?.length) { setPendingInvites([]); return; }
      const ids = inviteRows.map((r: any) => r.invited_user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", ids);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      setPendingInvites(inviteRows.map((r: any) => {
        const p: any = profileMap.get(r.invited_user_id);
        const name: string = p?.display_name || p?.username || "Unknown";
        return {
          id: r.id,
          userId: r.invited_user_id,
          name,
          initials: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
        };
      }));
    }
    loadPending();
  }, [canManage, groupId]);

  async function cancelInvite(inviteId: string) {
    await supabase.from("group_invites").delete().eq("id", inviteId);
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
    toast({ title: "Invite cancelled", type: "info" });
  }
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
          {/* Pending invites — owner/admin view */}
          {canManage && pendingInvites.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <Clock size={10} /> Pending — {pendingInvites.length}
              </h4>
              <div className="space-y-0.5">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 py-2 px-2 rounded-xl -mx-2" style={{ background: "var(--row-hover-bg)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: "var(--grad-brand)", opacity: 0.7 }}>
                      {inv.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold themed-text truncate">{inv.name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Invite sent…</p>
                    </div>
                    <button
                      onClick={() => cancelInvite(inv.id)}
                      title="Cancel invite"
                      className="p-1 rounded-lg hover:opacity-80 transition-opacity shrink-0"
                      style={{ color: "var(--danger)" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
