"use client";

import React, { useState } from "react";
import { NotificationTabs } from "@/features/notifications/components/NotificationTabs";
import { NotificationItem } from "@/features/notifications/components/NotificationItem";
import { CheckCheck } from "lucide-react";
import { IconButton } from "@/shared/components/IconButton";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "mentions" | "unread">("all");

  const notifications = [
    {
      id: "n1",
      type: "mention" as const,
      user: { name: "Aarav Sharma", initials: "AS" },
      groupName: "Engineering Team",
      content: "Hey @you, can you merge the PR?",
      time: "2m ago",
      isRead: false,
    },
    {
      id: "n2",
      type: "reply" as const,
      user: { name: "Priya Sharma", initials: "PS" },
      content: "Replied to your message: 'LGTM!'",
      time: "1h ago",
      isRead: false,
    },
    {
      id: "n3",
      type: "missed_call" as const,
      user: { name: "Rahul Kumar", initials: "RK" },
      content: "Missed video call from Rahul Kumar",
      time: "Yesterday",
      isRead: true,
    }
  ];

  const filtered = notifications.filter(n => {
    if (activeTab === "unread") return !n.isRead;
    if (activeTab === "mentions") return n.type === "mention";
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-canvas p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold themed-text">Notifications</h1>
        <IconButton size="sm" variant="ghost" className="text-brand-500 hover:bg-brand-50" tooltip="Mark all as read">
          <CheckCheck size={18} />
        </IconButton>
      </div>

      <NotificationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto space-y-3 pb-8 custom-scrollbar">
        {filtered.length > 0 ? (
          filtered.map(n => <NotificationItem key={n.id} {...n} />)
        ) : (
          <div className="text-center themed-text-3 py-12">No notifications found.</div>
        )}
      </div>
    </div>
  );
}
