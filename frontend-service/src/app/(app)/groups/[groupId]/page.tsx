"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GroupHeader } from "@/features/group/components/GroupHeader";
import { MembersPanel } from "@/features/group/components/MembersPanel";
import { GroupMessageBubble } from "@/features/group/components/GroupMessageBubble";
import { GroupInfoModal } from "@/features/group/components/GroupInfoModal";
import { Composer } from "@/features/chat/components/Composer";
import { useGroupMessages } from "@/features/group/hooks/use-group-messages";

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const {
    group, members, messages,
    send, addReaction, deleteMessage, editMessage, leaveGroup,
    loading, currentUserId, currentUserRole, reload,
  } = useGroupMessages(groupId);

  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  async function handleLeave() {
    await leaveGroup();
    router.push("/groups");
  }

  if (loading || !group) {
    return (
      <div className="flex-1 flex items-center justify-center themed-text-3 text-sm">
        Loading group…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative z-0">
      <GroupHeader
        group={group}
        onLeave={() => setConfirmLeave(true)}
        onInfoClick={() => setShowInfo(true)}
      />

      {/* Group info modal */}
      <GroupInfoModal
        open={showInfo}
        onClose={() => setShowInfo(false)}
        group={group}
        members={members}
      />

      {/* Leave confirmation */}
      {confirmLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmLeave(false)} />
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-elevated)" }}
          >
            <h3 className="font-bold themed-text text-base mb-2">Leave Group?</h3>
            <p className="text-sm themed-text-3 mb-6">
              You'll need an invite to rejoin <span className="font-semibold themed-text">{group.name}</span>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLeave(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold themed-text-2 transition-colors hover:bg-[var(--row-hover-bg)]"
                style={{ border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: "var(--danger)" }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
            {messages.length === 0 ? (
              <p className="text-center themed-text-3 text-sm py-12">No messages yet. Say hi!</p>
            ) : (
              messages.map((msg) => (
                <React.Fragment key={msg.id}>
                  {msg.dateStr && (
                    <div className="flex items-center gap-3 my-6">
                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                      <span
                        className="text-[11px] font-semibold px-3 py-1 rounded-full"
                        style={{
                          background: "var(--surface-2, var(--surface))",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {msg.dateStr}
                      </span>
                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    </div>
                  )}
                  <GroupMessageBubble
                    {...msg}
                    reactions={msg.reactions?.map(r => ({ emoji: r.emoji, count: r.count, active: r.reacted }))}
                    onReact={(emoji) => addReaction(msg.id, emoji)}
                    onDelete={msg.direction === "out" ? (id) => deleteMessage(id) : undefined}
                    onEdit={msg.direction === "out" ? (id, text) => editMessage(id, text) : undefined}
                  />
                </React.Fragment>
              ))
            )}
          </div>
          <Composer onSend={send} placeholder={`Message ${group.name}…`} />
        </div>
        <MembersPanel
          members={members}
          groupId={groupId}
          currentUserId={currentUserId ?? undefined}
          currentUserRole={currentUserRole ?? undefined}
          onMembersChange={reload}
        />
      </div>
    </div>
  );
}
