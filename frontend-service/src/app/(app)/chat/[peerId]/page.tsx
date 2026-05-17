"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { MessageThread, ThreadMessage } from "@/features/chat/components/MessageThread";
import { Composer } from "@/features/chat/components/Composer";
import { useChatMessages } from "@/features/chat/hooks/use-chat-messages";
import { createClient } from "@/core/auth/supabase-client";

interface PeerUser {
  id: string;
  name: string;
  initials: string;
  isOnline: boolean;
  avatarUrl?: string;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ChatPage() {
  const { peerId } = useParams<{ peerId: string }>();
  const { messages, send, addReaction, loading } = useChatMessages(peerId);

  const [peerUser, setPeerUser] = useState<PeerUser>({
    id: peerId,
    name: "Loading…",
    initials: "…",
    isOnline: false,
  });

  // Fetch peer user info directly from profiles
  useEffect(() => {
    if (!peerId) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, status")
      .eq("id", peerId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const name = (data as any).display_name || (data as any).username || "Unknown";
        setPeerUser({
          id: (data as any).id,
          name,
          initials: getInitials(name),
          isOnline: (data as any).status === "Online",
          avatarUrl: (data as any).avatar_url ?? undefined,
        });
      });
  }, [peerId]);

  const threadMessages: ThreadMessage[] = messages.map((m) => ({
    id: m.id,
    direction: m.isOwn ? "out" : "in",
    content: m.content,
    mediaUrl: m.mediaUrl,
    time: m.time,
    status: (m.status === "delivered" ? "sent" : m.status === "failed" ? "sending" : m.status) as ThreadMessage["status"],
    reactions: m.reactions?.map((r) => ({ emoji: r.emoji, count: r.count, active: r.reacted })),
    onReact: (emoji: string) => addReaction(m.id, emoji),
  }));

  return (
    <div className="flex flex-col h-full themed-canvas relative z-0">
      <ChatHeader user={peerUser} isTyping={false} />
      {loading ? (
        <div className="flex-1 flex items-center justify-center themed-text-3 text-sm">
          Loading messages…
        </div>
      ) : (
        <MessageThread messages={threadMessages} />
      )}
      <Composer onSend={(text, mediaUrl) => send(text, mediaUrl)} />
    </div>
  );
}
