"use client";

import { Phone, Video, MoreVertical } from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { IconButton } from "@/shared/components/IconButton";
import { TypingDots } from "@/shared/components/TypingDots";
import { User } from "@/features/dashboard/lib/mock-data";

export interface ChatHeaderProps {
  user: User;
  isTyping?: boolean;
  subText?: string;
}

export function ChatHeader({ user, isTyping, subText }: ChatHeaderProps) {
  const statusLine = isTyping ? null : (subText ?? (user.isOnline ? "Online now" : "Last seen recently"));

  return (
    <div className="h-[72px] shrink-0 border-b themed-border px-6 flex items-center justify-between sticky top-0 z-10"
      style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}
    >
      <div className="flex items-center gap-4 cursor-pointer group">
        <Avatar initials={user.initials} online={user.isOnline} verified={user.isVerified} size="md" />
        <div>
          <h3 className="font-bold themed-text group-hover:text-[var(--brand-text)] transition-colors">
            {user.name}
          </h3>
          <div className="text-xs themed-text-2 flex items-center h-4">
            {isTyping ? (
              <div className="flex items-center gap-1.5" style={{ color: "var(--brand-text)" }}>
                <TypingDots /> <span className="italic">typing...</span>
              </div>
            ) : (
              <span style={{ color: user.isOnline ? "var(--success)" : "var(--text-muted)" }}>
                {statusLine}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton size="md" variant="ghost" className="themed-text-2 hover:text-[var(--brand-text)] hover:bg-[var(--row-hover-bg)]" tooltip="Audio Call">
          <Phone size={20} />
        </IconButton>
        <IconButton size="md" variant="ghost" className="themed-text-2 hover:text-[var(--brand-text)] hover:bg-[var(--row-hover-bg)]" tooltip="Video Call">
          <Video size={20} />
        </IconButton>
        <div className="w-px h-6 mx-1" style={{ background: "var(--border)" }} />
        <IconButton size="md" variant="ghost" className="themed-text-2 hover:themed-text" tooltip="More">
          <MoreVertical size={20} />
        </IconButton>
      </div>
    </div>
  );
}
