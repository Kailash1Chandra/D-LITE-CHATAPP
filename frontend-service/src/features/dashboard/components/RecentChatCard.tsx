"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar } from "@/shared/components/Avatar";
import { ChatPreview } from "../lib/mock-data";

export function RecentChatCard({ chat, index }: { chat: ChatPreview; index: number }) {
  const hasUnread = chat.unreadCount > 0;

  return (
    <Link href={`/chat/${chat.id}`}>
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ x: 4 }}
        className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer"
        style={{ background: hasUnread ? "var(--row-hover-bg)" : "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--row-hover-bg)")}
        onMouseLeave={e => (e.currentTarget.style.background = hasUnread ? "var(--row-hover-bg)" : "transparent")}
      >
        <Avatar src={chat.user.avatarUrl} initials={chat.user.initials} online={chat.user.isOnline} verified={chat.user.isVerified} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <h4
              className="text-sm truncate"
              style={{ fontWeight: hasUnread ? 700 : 600, color: "var(--text-primary)" }}
            >
              {chat.user.name}
            </h4>
            <span
              className="text-[11px] shrink-0 ml-2"
              style={{ color: hasUnread ? "var(--brand-text)" : "var(--text-muted)" }}
            >
              {chat.time}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs truncate" style={{ color: "var(--text-muted)", fontWeight: hasUnread ? 500 : 400 }}>
              {chat.lastMessage}
            </p>
            {hasUnread && (
              <span
                className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "var(--brand-text)" }}
              >
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
