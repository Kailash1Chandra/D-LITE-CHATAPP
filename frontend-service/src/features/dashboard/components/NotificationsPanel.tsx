"use client";

import { Bell, Users, Check, X } from "lucide-react";
import { useGroupInvites } from "@/features/group/hooks/use-group-invites";

export function NotificationsPanel() {
  const { invites, acceptInvite, declineInvite } = useGroupInvites();

  return (
    <div
      className="rounded-2xl overflow-hidden h-fit"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-2.5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--grad-brand)" }}
        >
          <Bell size={13} className="text-white" />
        </div>
        <h3 className="font-bold themed-text text-sm flex-1">Notifications</h3>
        {invites.length > 0 && (
          <span
            className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
            style={{ background: "var(--brand-text)" }}
          >
            {invites.length}
          </span>
        )}
      </div>

      {/* List */}
      <div>
        {invites.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-14 px-4 text-center">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--row-hover-bg)" }}
            >
              <Bell size={18} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-semibold themed-text">All caught up</p>
            <p className="text-xs themed-text-3">No new notifications</p>
          </div>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-start gap-3 px-4 py-3.5 border-b hover:bg-[var(--row-hover-bg)] transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(139,92,246,0.15)" }}
              >
                <Users size={15} style={{ color: "#8b5cf6" }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold themed-text mb-0.5">Group Invite</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold themed-text">{invite.invitedBy}</span>
                  {" "}invited you to join{" "}
                  <span className="font-semibold themed-text">{invite.groupName}</span>
                </p>
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => acceptInvite(invite)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white hover:opacity-80 transition-opacity"
                    style={{ background: "var(--success)" }}
                  >
                    <Check size={10} strokeWidth={3} /> Accept
                  </button>
                  <button
                    onClick={() => declineInvite(invite.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{
                      background: "var(--row-hover-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <X size={10} /> Decline
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
