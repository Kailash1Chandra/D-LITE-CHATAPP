import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { RecentChatCard } from "./RecentChatCard";
import { getRecentConversations } from "@/core/data/dashboard";
import { getUser } from "@/core/auth/get-user";

export async function RecentChatsGrid() {
  const user = await getUser();
  const chats = user ? await getRecentConversations(user.id) : [];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
          >
            <MessageCircle size={14} className="text-white" />
          </div>
          <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Recent Chats</h3>
        </div>
        <Link
          href="/chat"
          className="text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: "var(--brand-text)" }}
        >
          View all →
        </Link>
      </div>

      <div className="p-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--row-hover-bg)" }}
            >
              <MessageCircle size={20} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No conversations yet</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Start chatting with someone</p>
          </div>
        ) : (
          chats.slice(0, 6).map((chat, i) => <RecentChatCard key={chat.id} chat={chat} index={i} />)
        )}
      </div>
    </div>
  );
}
