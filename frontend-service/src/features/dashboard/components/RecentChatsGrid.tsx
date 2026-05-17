import Link from "next/link";
import { RecentChatCard } from "./RecentChatCard";
import { getRecentConversations } from "@/core/data/dashboard";
import { getUser } from "@/core/auth/get-user";

export async function RecentChatsGrid() {
  const user = await getUser();
  const chats = user ? await getRecentConversations(user.id) : [];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold themed-text">Recent Chats</h2>
        <Link href="/chat" className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
          View all →
        </Link>
      </div>
      {chats.length === 0 ? (
        <p className="text-sm themed-text-3 py-4">No recent chats yet. Start a conversation!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat) => (
            <RecentChatCard key={chat.id} chat={chat} />
          ))}
        </div>
      )}
    </div>
  );
}
