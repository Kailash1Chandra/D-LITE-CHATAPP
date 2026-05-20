"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar } from "@/shared/components/Avatar";
import { ChatPreview } from "@/features/dashboard/lib/mock-data";

export function ChatListItem({ chat }: { chat: ChatPreview }) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/chat/${chat.id}`);
  const hasUnread = chat.unreadCount > 0 && !isActive;

  return (
    <Link href={`/chat/${chat.id}`}>
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer relative"
        style={{
          background: isActive
            ? "linear-gradient(90deg, var(--row-active-bg, rgba(168,85,247,0.15)), transparent)"
            : "transparent",
        }}
        onMouseEnter={e => {
          if (!isActive) e.currentTarget.style.background = "var(--row-hover-bg)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isActive
            ? "linear-gradient(90deg, var(--row-active-bg, rgba(168,85,247,0.15)), transparent)"
            : "transparent";
        }}
      >
        {/* Active indicator — vertical pill on left */}
        {isActive && (
          <motion.div
            layoutId="active-chat-pill"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full"
            style={{ height: 28, background: "var(--accent-purple)" }}
          />
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar
            src={chat.user.avatarUrl}
            initials={chat.user.initials}
            online={chat.user.isOnline}
            verified={chat.user.isVerified}
            size="md"
          />
          {/* Pulsing unread dot on avatar */}
          {hasUnread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{
                background: "var(--accent-purple)",
                borderColor: "var(--surface)",
              }}
            />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1 mb-0.5">
            <span
              className="text-sm truncate"
              style={{
                color: "var(--text-primary)",
                fontWeight: hasUnread || isActive ? 700 : 500,
              }}
            >
              {chat.user.name}
            </span>
            <span
              className="text-[11px] shrink-0 tabular-nums"
              style={{ color: hasUnread ? "var(--accent-purple)" : "var(--text-muted)" }}
            >
              {chat.time}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {chat.isTyping ? (
              <span className="text-[12px] italic font-medium" style={{ color: "var(--accent-purple)" }}>
                typing…
              </span>
            ) : (
              <p
                className="text-[13px] truncate flex-1"
                style={{
                  color: hasUnread ? "var(--text-secondary)" : "var(--text-muted)",
                  fontWeight: hasUnread ? 500 : 400,
                }}
              >
                {chat.lastMessage}
              </p>
            )}
            {hasUnread && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                style={{ background: "var(--accent-purple)" }}
              >
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
