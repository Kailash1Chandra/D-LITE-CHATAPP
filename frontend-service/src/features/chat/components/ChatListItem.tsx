"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/shared/components/Avatar";
import { ChatPreview } from "@/features/dashboard/lib/mock-data";

export function ChatListItem({ chat }: { chat: ChatPreview }) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/chat/${chat.id}`);
  const hasUnread = chat.unreadCount > 0 && !isActive;

  return (
    <Link
      href={`/chat/${chat.id}`}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all relative ${
        isActive
          ? "bg-[var(--row-active-bg)] border-l-[3px] border-[var(--row-active-border)]"
          : hasUnread
          ? "hover:bg-[var(--row-hover-bg)] bg-[var(--row-hover-bg)]/50"
          : "hover:bg-[var(--row-hover-bg)]"
      }`}
    >
      <div className="relative shrink-0">
        <Avatar
          initials={chat.user.initials}
          online={chat.user.isOnline}
          verified={chat.user.isVerified}
          size="md"
        />
        {/* Pulsing dot for unread */}
        <AnimatePresence>
          {hasUnread && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ background: "var(--brand-text)", border: "2px solid var(--surface)" }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--brand-text)" }}
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h4
            className="text-sm truncate"
            style={{
              fontWeight: hasUnread ? 700 : 600,
              color: "var(--text-primary)",
            }}
          >
            {chat.user.name}
          </h4>
          <span
            className="text-[11px] shrink-0 ml-1"
            style={{ color: hasUnread ? "var(--brand-text)" : "var(--text-muted)", fontWeight: hasUnread ? 600 : 400 }}
          >
            {chat.time}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {chat.isTyping ? (
            <span className="text-xs font-medium italic" style={{ color: "var(--brand-text)" }}>
              typing…
            </span>
          ) : (
            <p
              className="text-sm truncate"
              style={{
                color: hasUnread ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: hasUnread ? 500 : 400,
              }}
            >
              {chat.lastMessage}
            </p>
          )}

          {/* Unread count badge */}
          <AnimatePresence>
            {hasUnread && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: "var(--brand-text)" }}
              >
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Link>
  );
}
