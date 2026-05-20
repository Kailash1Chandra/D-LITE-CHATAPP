"use client";

import { useEffect, useState } from "react";
import { Phone, Video, PhoneMissed, PhoneCall, PhoneIncoming, PhoneOutgoing, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/core/auth/supabase-client";
import { Avatar } from "@/shared/components/Avatar";
import { Pill } from "@/shared/components/Pill";

interface CallRecord {
  id: string;
  type: "audio" | "video";
  status: "completed" | "missed" | "rejected" | string;
  startedAt: string;
  endedAt: string | null;
  isIncoming: boolean;
  peer: {
    id: string;
    name: string;
    initials: string;
  };
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return "";
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}:${rem.toString().padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function CallRow({ call }: { call: CallRecord }) {
  const isMissed = call.status === "missed" || call.status === "rejected";
  const duration = formatDuration(call.startedAt, call.endedAt);

  const CallIcon = isMissed
    ? PhoneMissed
    : call.isIncoming
    ? PhoneIncoming
    : PhoneOutgoing;

  const typeIcon = call.type === "video" ? Video : Phone;
  const TypeIcon = typeIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 3 }}
      className="flex items-center gap-4 py-3.5 px-4 rounded-xl hover:bg-[var(--row-hover-bg)] transition-colors cursor-default"
    >
      <div className="relative shrink-0">
        <Avatar initials={call.peer.initials} size="md" />
        <div
          className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border`}
          style={{
            background: isMissed ? "var(--danger)" : "var(--surface-2, var(--surface))",
            borderColor: "var(--border)",
            color: isMissed ? "#fff" : "var(--text-muted)",
          }}
        >
          <CallIcon size={10} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold themed-text truncate">{call.peer.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <TypeIcon size={11} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs themed-text-3">{formatTime(call.startedAt)}</span>
          {isMissed ? (
            <Pill variant="danger" className="text-[10px] px-2 py-0 h-4">Missed</Pill>
          ) : duration ? (
            <Pill variant="neutral" className="text-[10px] px-2 py-0 h-4">{duration}</Pill>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Chat */}
        <Link href={`/chat/${call.peer.id}`}>
          <button
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "var(--row-hover-bg)", color: "var(--text-muted)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--brand-text)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            title="Open chat"
          >
            <MessageSquare size={14} />
          </button>
        </Link>
        {/* Audio call */}
        <Link href={`/chat/${call.peer.id}`}>
          <button
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "var(--row-hover-bg)", color: "var(--text-muted)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--brand-text)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            title="Audio call"
          >
            <PhoneCall size={14} />
          </button>
        </Link>
        {/* Video call */}
        <Link href={`/chat/${call.peer.id}`}>
          <button
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "var(--row-hover-bg)", color: "var(--text-muted)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--brand-text)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            title="Video call"
          >
            <Video size={14} />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("calls")
        .select(`
          id, type, status, started_at, ended_at, caller_id, receiver_id,
          caller:profiles!calls_caller_id_fkey(id, display_name, username),
          receiver:profiles!calls_receiver_id_fkey(id, display_name, username)
        `)
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("started_at", { ascending: false })
        .limit(50);

      if (data) {
        setCalls(
          data.map((row: any) => {
            const isIncoming = row.receiver_id === user.id;
            const peerRaw = isIncoming ? row.caller : row.receiver;
            const name = peerRaw?.display_name || peerRaw?.username || "Unknown";
            return {
              id: row.id,
              type: row.type === "video" ? "video" : "audio",
              status: row.status || "completed",
              startedAt: row.started_at,
              endedAt: row.ended_at,
              isIncoming,
              peer: {
                id: peerRaw?.id || "",
                name,
                initials: getInitials(name),
              },
            } satisfies CallRecord;
          })
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-text)" }} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col themed-canvas relative z-0">
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-xl font-bold themed-text">Call History</h1>
        <p className="text-sm themed-text-3 mt-0.5">{calls.length} recent call{calls.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center pb-16">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface-2, var(--surface))", border: "1px solid var(--border)" }}
            >
              <Phone size={32} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="font-semibold themed-text">No calls yet</p>
            <p className="text-sm themed-text-3 max-w-xs">
              Start a call from any chat by tapping the phone or video icon.
            </p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-0.5">
            {calls.map(call => (
              <CallRow key={call.id} call={call} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
