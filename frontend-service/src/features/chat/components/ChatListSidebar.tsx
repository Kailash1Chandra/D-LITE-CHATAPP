"use client";

import { useState } from "react";
import { Search, SquarePen } from "lucide-react";
import { motion } from "framer-motion";
import { ChatListItem } from "./ChatListItem";
import { NewChatModal } from "./NewChatModal";
import { useDMConversations } from "../hooks/use-dm-conversations";
import type { ChatPreview } from "@/features/dashboard/lib/mock-data";

export function ChatListSidebar() {
  const [search, setSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const { conversations, loading } = useDMConversations();

  const chats: ChatPreview[] = conversations.map((c) => ({
    id: c.id,
    user: c.user,
    lastMessage: c.lastMessage,
    time: c.time,
    unreadCount: c.unreadCount,
  }));

  const filtered = chats.filter((chat) =>
    chat.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = chats.filter(c => c.user.isOnline).length;

  return (
    <>
      <div
        className="w-[272px] h-full flex flex-col shrink-0"
        style={{
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Direct Messages
              </h2>
              {onlineCount > 0 && (
                <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: "var(--success)" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
                  {onlineCount} online
                </p>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.12, rotate: 12 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setNewChatOpen(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "var(--accent-purple)";
                e.currentTarget.style.background = "var(--row-hover-bg)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
              title="New message"
            >
              <SquarePen size={15} />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Find a conversation"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg text-[13px] outline-none transition-all"
              style={{
                background: "var(--row-hover-bg)",
                border: "1px solid transparent",
                color: "var(--text-primary)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-purple)")}
              onBlur={e => (e.currentTarget.style.borderColor = "transparent")}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
          {loading ? (
            <div className="space-y-1 px-1 pt-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-10 h-10 rounded-full animate-pulse shrink-0" style={{ background: "var(--row-hover-bg)" }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded animate-pulse" style={{ background: "var(--row-hover-bg)", width: "60%" }} />
                    <div className="h-2.5 rounded animate-pulse" style={{ background: "var(--row-hover-bg)", width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(chat => <ChatListItem key={chat.id} chat={chat} />)
          ) : (
            <div className="flex flex-col items-center gap-2.5 py-12 px-4 text-center">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--row-hover-bg)" }}
              >
                <SquarePen size={18} style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                  {conversations.length === 0 ? "No conversations" : "No results"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {conversations.length === 0 ? "Start a new message" : "Try a different name"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewChatModal open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </>
  );
}
