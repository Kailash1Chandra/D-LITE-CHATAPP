"use client";

import Link from "next/link";
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneCall } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/shared/components/Avatar";
import { CallPreview } from "../lib/mock-data";

function CallItem({ call, index }: { call: CallPreview; index: number }) {
  const isMissed = call.status === "missed";
  const isVideo = call.type === "video";

  const iconBg = isMissed
    ? "linear-gradient(135deg,#ef4444,#f43f5e)"
    : isVideo
    ? "linear-gradient(135deg,#0ea5e9,#6366f1)"
    : "linear-gradient(135deg,#10b981,#06b6d4)";

  const CallIcon = isMissed ? PhoneMissed : isVideo ? Video : PhoneIncoming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ x: 3 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
      onMouseEnter={e => (e.currentTarget.style.background = "var(--row-hover-bg)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div className="relative shrink-0">
        <Avatar src={call.user.avatarUrl} initials={call.user.initials} online={call.user.isOnline} size="sm" />
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2"
          style={{ background: iconBg, borderColor: "var(--surface)" }}
        >
          <CallIcon size={8} className="text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: isMissed ? "#ef4444" : "var(--text-primary)" }}>
          {call.user.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{call.time}</span>
          {call.duration && (
            <>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>·</span>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{call.duration}</span>
            </>
          )}
        </div>
      </div>

      <Link href={`/chat/${call.user.id}`}>
        <motion.div
          whileHover={{ scale: 1.15 }}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--row-hover-bg)" }}
        >
          <PhoneCall size={13} style={{ color: "var(--brand-text)" }} />
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function RecentCallsCard({ calls }: { calls: CallPreview[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#ec4899,#f43f5e)" }}
          >
            <Phone size={14} className="text-white" />
          </div>
          <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Recent Calls</h3>
        </div>
        <Link
          href="/calls"
          className="text-xs font-semibold hover:opacity-70 transition-opacity"
          style={{ color: "var(--brand-text)" }}
        >
          View all →
        </Link>
      </div>

      <div className="p-2 flex-1">
        {calls.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--row-hover-bg)" }}
            >
              <Phone size={20} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No calls yet</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your call history will appear here</p>
          </div>
        ) : (
          calls.slice(0, 7).map((call, i) => <CallItem key={call.id} call={call} index={i} />)
        )}
      </div>
    </div>
  );
}
