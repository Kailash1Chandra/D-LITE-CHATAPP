"use client";

import React from "react";
import { useParams } from "next/navigation";
import { GroupHeader } from "@/features/group/components/GroupHeader";
import { MembersPanel } from "@/features/group/components/MembersPanel";
import { GroupMessageBubble } from "@/features/group/components/GroupMessageBubble";
import { Composer } from "@/features/chat/components/Composer";
import { useGroupMessages } from "@/features/group/hooks/use-group-messages";

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { group, members, messages, send, deleteMessage, editMessage, loading, currentUserId, currentUserRole, reload } = useGroupMessages(groupId);

  if (loading || !group) {
    return (
      <div className="flex-1 flex items-center justify-center themed-text-3 text-sm">
        Loading group…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative z-0">
      <GroupHeader group={group} />

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
