"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { ChatStatusBanner, type ChatFlag } from "@/features/chat/components/ChatStatusBanner";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { ThreadMessage } from "@/features/chat/components/MessageThread";
import { CallBubble } from "@/features/chat/components/CallBubble";
import { Composer } from "@/features/chat/components/Composer";
import { useChatMessages } from "@/features/chat/hooks/use-chat-messages";
import { usePresence } from "@/features/chat/hooks/use-presence";
import { createClient } from "@/core/auth/supabase-client";

function getChatKey(userId: string, suffix: string) {
  return `dlite_chat_${userId}_${suffix}`;
}
function readFlag(userId: string, key: string): boolean {
  try { return localStorage.getItem(getChatKey(userId, key)) === "1"; } catch { return false; }
}
function writeFlag(userId: string, key: string, val: boolean) {
  try { localStorage.setItem(getChatKey(userId, key), val ? "1" : "0"); } catch {}
}

interface PeerUser {
  id: string;
  name: string;
  initials: string;
  isOnline: boolean;
  avatarUrl?: string;
  lastSeen?: string;
}

interface CallRecord {
  id: string;
  type: "audio" | "video";
  status: string;
  startedAt: string;
  endedAt: string | null;
  isOwn: boolean;
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

function formatDuration(startedAt: string, endedAt: string | null): string | undefined {
  if (!endedAt) return undefined;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return undefined;
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}:${rem.toString().padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// A thread item can be a message OR a call record
type ThreadItem =
  | { kind: "message"; ts: number; data: ThreadMessage }
  | { kind: "call"; ts: number; data: CallRecord };

export default function ChatPage() {
  const { peerId } = useParams<{ peerId: string }>();
  const { messages, send, addReaction, deleteMessage, editMessage, loading, isBlockedByPeer } = useChatMessages(peerId);
  const { isOnline } = usePresence();

  const [peer, setPeer] = useState<PeerUser>({ id: peerId, name: "Loading…", initials: "…", isOnline: false });
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [chatFlags, setChatFlags] = useState<Partial<Record<ChatFlag, boolean>>>({});

  // Load peer profile
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
        setPeer({ id: d.id, name, initials: getInitials(name), isOnline: isOnline(d.id) || d.status === "Online", avatarUrl: d.avatar_url ?? undefined, lastSeen: d.last_seen_at });
      });
  }, [peerId, isOnline]);

  // Load call history between me and peer
  useEffect(() => {
    if (!peerId) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("calls")
        .select("id, type, status, started_at, ended_at, caller_id, receiver_id")
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("started_at", { ascending: true })
        .then(({ data }) => {
          if (!data) return;
          // Only calls between me and this peer
          const filtered = (data as any[]).filter(
            r => (r.caller_id === user.id && r.receiver_id === peerId) ||
                 (r.receiver_id === user.id && r.caller_id === peerId)
          );
          setCalls(filtered.map(r => ({
            id: r.id,
            type: r.type === "video" ? "video" : "audio",
            status: r.status,
            startedAt: r.started_at,
            endedAt: r.ended_at,
            isOwn: r.caller_id === user.id,
          })));
        });
    });
  }, [peerId]);

  // Read flags from localStorage and re-read on any flag-change event
  useEffect(() => {
    if (!peerId) return;
    function refresh() {
      setChatFlags({
        blocked:    readFlag(peerId, "blocked"),
        locked:     readFlag(peerId, "locked"),
        restricted: readFlag(peerId, "restricted"),
        muted:      readFlag(peerId, "muted"),
      });
    }
    refresh();
    window.addEventListener("dlite:flag-change", refresh);
    return () => window.removeEventListener("dlite:flag-change", refresh);
  }, [peerId]);

  function handleFlagAction(flag: ChatFlag) {
    writeFlag(peerId, flag, false);
    setChatFlags(prev => ({ ...prev, [flag]: false }));
    window.dispatchEvent(new CustomEvent("dlite:flag-change", { detail: { userId: peerId, key: flag, val: false } }));
  }

  const bottomRef = useRef<HTMLDivElement>(null);
  const peerOnline = isOnline(peerId);
  const peerUser = { ...peer, isOnline: peerOnline };
  const subText = peerOnline ? "Online now" : formatLastSeen(peer.lastSeen);

  // Build merged thread (messages + calls), sorted by timestamp
  const threadItems: ThreadItem[] = [
    ...messages.map((m): ThreadItem => ({
      kind: "message",
      ts: new Date(m.createdAt).getTime(),
      data: {
        id: m.id,
        direction: m.isOwn ? "out" : "in",
        content: m.content,
        mediaUrl: m.mediaUrl,
        time: m.time,
        status: (m.status === "failed" ? "sending" : m.status ?? "sent") as ThreadMessage["status"],
        reactions: m.reactions?.map(r => ({ emoji: r.emoji, count: r.count, active: r.reacted })),
        onReact: (emoji: string) => addReaction(m.id, emoji),
        onDelete: m.isOwn ? (id: string) => deleteMessage(id) : undefined,
        onEdit: m.isOwn ? (id: string, text: string) => editMessage(id, text) : undefined,
      },
    })),
    ...calls.map((c): ThreadItem => ({
      kind: "call",
      ts: new Date(c.startedAt).getTime(),
      data: c,
    })),
  ].sort((a, b) => a.ts - b.ts);

  // Scroll to bottom only when new items arrive, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadItems.length]);

  return (
    <div className="flex flex-col h-full themed-canvas relative z-0">
      <ChatHeader user={peerUser} isTyping={false} subText={subText} />
      <ChatStatusBanner
        flags={{ ...chatFlags, blockedByPeer: isBlockedByPeer }}
        onAction={handleFlagAction}
      />
      {loading ? (
        <div className="flex-1 flex items-center justify-center themed-text-3 text-sm">
          Loading messages…
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth custom-scrollbar">
          {threadItems.map(item =>
            item.kind === "message" ? (
              <MessageBubble key={item.data.id} {...item.data} />
            ) : (
              <CallBubble
                key={item.data.id}
                type={item.data.type}
                status={item.data.status}
                duration={formatDuration(item.data.startedAt, item.data.endedAt)}
                time={formatTime(item.data.startedAt)}
                isOwn={item.data.isOwn}
              />
            )
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      )}
      {isBlockedByPeer ? (
        <div
          className="shrink-0 px-5 py-4 flex items-center justify-center gap-2 text-sm border-t"
          style={{ background: "var(--header-bg)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <span>You can&apos;t send messages — you&apos;ve been blocked by this user.</span>
        </div>
      ) : (
        <Composer onSend={(text, mediaUrl) => send(text, mediaUrl)} />
      )}
    </div>
  );
}
