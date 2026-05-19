"use client";

import { useRouter } from "next/navigation";
import { Phone, Video, MoreVertical, Download } from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { IconButton } from "@/shared/components/IconButton";
import { TypingDots } from "@/shared/components/TypingDots";
import { User } from "@/features/dashboard/lib/mock-data";
import { createClient } from "@/core/auth/supabase-client";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface ChatHeaderProps {
  user: User;
  isTyping?: boolean;
  subText?: string;
}

export function ChatHeader({ user, isTyping, subText }: ChatHeaderProps) {
  const router = useRouter();
  const statusLine = isTyping ? null : (subText ?? (user.isOnline ? "Online now" : "Last seen recently"));
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showMenu]);

  async function startCall(type: "audio" | "video") {
    const supabase = createClient();
    const { data: { user: me } } = await supabase.auth.getUser();
    if (!me) return;

    const { data, error } = await supabase
      .from("calls")
      .insert({ caller_id: me.id, receiver_id: user.id, type, status: "ringing" })
      .select("id")
      .single();

    if (error || !data) {
      // fallback: navigate anyway with a generated room
      router.push(`/call/dm-${user.id}?type=${type}`);
      return;
    }
    router.push(`/call/${data.id}?type=${type}&peerId=${user.id}`);
  }

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
        <IconButton size="md" variant="ghost" className="themed-text-2 hover:text-[var(--brand-text)] hover:bg-[var(--row-hover-bg)]" tooltip="Audio Call" onClick={() => startCall("audio")}>
          <Phone size={20} />
        </IconButton>
        <IconButton size="md" variant="ghost" className="themed-text-2 hover:text-[var(--brand-text)] hover:bg-[var(--row-hover-bg)]" tooltip="Video Call" onClick={() => startCall("video")}>
          <Video size={20} />
        </IconButton>
        <div className="w-px h-6 mx-1" style={{ background: "var(--border)" }} />
        <div ref={menuRef} className="relative">
          <IconButton size="md" variant="ghost" className="themed-text-2 hover:themed-text" tooltip="More"
            onClick={() => setShowMenu(v => !v)}>
            <MoreVertical size={20} />
          </IconButton>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1 rounded-2xl overflow-hidden z-50"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  minWidth: 180,
                }}
              >
                <button
                  onClick={() => { setShowMenu(false); router.push(`/settings/backup`); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium themed-text hover:bg-[var(--row-hover-bg)] transition-colors"
                >
                  <Download size={15} style={{ color: "var(--text-muted)" }} />
                  Export Chat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
