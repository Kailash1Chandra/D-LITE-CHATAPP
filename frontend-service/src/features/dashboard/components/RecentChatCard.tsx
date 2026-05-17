"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { ChatPreview } from "../lib/mock-data";

export function RecentChatCard({ chat }: { chat: ChatPreview }) {
  return (
    <Link href={`/chat/${chat.id}`}>
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="themed-surface border themed-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-[var(--brand-400)] transition-colors shadow-card hover:shadow-elevated"
    >
      <Avatar 
        initials={chat.user.initials} 
        online={chat.user.isOnline} 
        verified={chat.user.isVerified} 
        size="md" 
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h4 className="text-sm font-semibold themed-text truncate">{chat.user.name}</h4>
          <span className="text-xs themed-text-3 whitespace-nowrap ml-2">{chat.time}</span>
        </div>
        <div className="flex items-center gap-2">
          {chat.isTyping ? (
            <span className="text-xs text-brand-500 font-medium italic">typing...</span>
          ) : (
            <p className="text-sm themed-text-2 truncate flex-1">{chat.lastMessage}</p>
          )}
          {chat.unreadCount > 0 && <Badge count={chat.unreadCount} />}
        </div>
      </div>
    </motion.div>
    </Link>
  );
}
