"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { MessageThread, ThreadMessage } from "@/features/chat/components/MessageThread";
import { Composer } from "@/features/chat/components/Composer";
import { useChatMessages } from "@/features/chat/hooks/use-chat-messages";
import { usePresence } from "@/features/chat/hooks/use-presence";
import { createClient } from "@/core/auth/supabase-client";

interface PeerUser {
  id: string;
  name: string;
  initials: string;
  isOnline: boolean;
  avatarUrl?: string;
  lastSeen?: string;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatLastSeen(iso: string | null | undefined): string {
  if (!iso) return "Last seen recently";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Last seen ${hrs}h ago`;
  return `Last seen ${Math.floor(hrs / 24)}d ago`;
}

export default function ChatPage() {
  const { peerId } = useParams<{ peerId: string }>();
  const { messages, send, addReaction, deleteMessage, editMessage, loading } = useChatMessages(peerId);
  const { isOnline } = usePresence();

  const [peer, setPeer] = useState<PeerUser>({
    id: peerId,
    name: "Loading…",
    initials: "…",
    isOnline: false,
  });

  useEffect(() => {
    if (!peerId) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, status, last_seen_at")
      .eq("id", peerId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const d = data as any;
        const name = d.display_name || d.username || "Unknown";
        setPeer({
          id: d.id,
          name,
          initials: getInitials(name),
          isOnline: isOnline(d.id) || d.status === "Online",
          avatarUrl: d.avatar_url ?? undefined,
          lastSeen: d.last_seen_at,
        });
      });
  }, [peerId, isOnline]);

  // Sync live presence into peer state
  const peerOnline = isOnline(peerId);
  const peerUser = {
    ...peer,
    isOnline: peerOnline,
  };

  const subText = peerOnline
    ? "Online now"
    : formatLastSeen(peer.lastSeen);

  const threadMessages: ThreadMessage[] = messages.map((m) => ({
    id: m.id,
    direction: m.isOwn ? "out" : "in",
    content: m.content,
    mediaUrl: m.mediaUrl,
    time: m.time,
    status: (m.status === "failed" ? "sending" : m.status ?? "sent") as ThreadMessage["status"],
    reactions: m.reactions?.map((r) => ({ emoji: r.emoji, count: r.count, active: r.reacted })),
    onReact: (emoji: string) => addReaction(m.id, emoji),
    onDelete: m.isOwn ? (id: string) => deleteMessage(id) : undefined,
    onEdit: m.isOwn ? (id: string, text: string) => editMessage(id, text) : undefined,
  }));

  return (
    <div className="flex flex-col h-full themed-canvas relative z-0">
      <ChatHeader user={peerUser} isTyping={false} subText={subText} />
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
