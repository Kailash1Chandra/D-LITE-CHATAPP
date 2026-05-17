"use client";

import { useState } from "react";
import { Edit, Search } from "lucide-react";
import { IconButton } from "@/shared/components/IconButton";
import { Input } from "@/shared/components/Input";
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

  return (
    <>
      <div className="w-[280px] h-full border-r themed-border themed-surface flex flex-col shrink-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold themed-text">Chats</h2>
            <IconButton
              size="sm"
              variant="secondary"
              tooltip="New chat"
              onClick={() => setNewChatOpen(true)}
            >
              <Edit size={16} />
            </IconButton>
          </div>
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            iconLeft={<Search size={16} />}
            className="themed-input h-9 py-0 text-sm w-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {loading ? (
            <div className="text-center text-sm themed-text-3 py-8">Loading...</div>
          ) : filtered.length > 0 ? (
            filtered.map((chat) => <ChatListItem key={chat.id} chat={chat} />)
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--row-hover-bg)" }}
              >
                <Edit size={20} style={{ color: "var(--brand-text)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold themed-text mb-0.5">
                  {conversations.length === 0 ? "No conversations yet" : "No chats found"}
                </p>
                <p className="text-xs themed-text-3">
                  {conversations.length === 0
                    ? "Tap the pencil icon to start a new chat"
                    : "Try a different name"}
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
