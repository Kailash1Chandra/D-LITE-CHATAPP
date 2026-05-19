"use client";

import { useRouter } from "next/navigation";
import { Phone, Video, MoreVertical, Download, VolumeX, Volume2, Lock, ShieldOff, Ban } from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { IconButton } from "@/shared/components/IconButton";
import { TypingDots } from "@/shared/components/TypingDots";
import { User } from "@/features/dashboard/lib/mock-data";
import { createClient } from "@/core/auth/supabase-client";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserProfilePanel } from "./UserProfilePanel";

export interface ChatHeaderProps {
  user: User;
  isTyping?: boolean;
  subText?: string;
}

// ── Chat settings stored in localStorage ──────────────────────────────────────
function getChatKey(userId: string, suffix: string) {
  return `dlite_chat_${userId}_${suffix}`;
}
function getFlag(userId: string, key: string): boolean {
  try { return localStorage.getItem(getChatKey(userId, key)) === "1"; } catch { return false; }
}
function setFlag(userId: string, key: string, val: boolean) {
  try { localStorage.setItem(getChatKey(userId, key), val ? "1" : "0"); } catch {}
}

export function ChatHeader({ user, isTyping, subText }: ChatHeaderProps) {
  const router = useRouter();
  const statusLine = isTyping ? null : (subText ?? (user.isOnline ? "Online now" : "Last seen recently"));
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Chat flags
  const [muted,      setMutedState]    = useState(false);
  const [blocked,    setBlockedState]  = useState(false);
  const [restricted, setRestrictedState] = useState(false);
  const [locked,     setLockedState]   = useState(false);

  useEffect(() => {
    setMutedState(getFlag(user.id, "muted"));
    setBlockedState(getFlag(user.id, "blocked"));
    setRestrictedState(getFlag(user.id, "restricted"));
    setLockedState(getFlag(user.id, "locked"));
  }, [user.id]);

  useEffect(() => {
    if (!showMenu) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showMenu]);

  function toggle(key: "muted" | "blocked" | "restricted" | "locked") {
    const map = { muted, blocked, restricted, locked };
    const setMap = { muted: setMutedState, blocked: setBlockedState, restricted: setRestrictedState, locked: setLockedState };
    const newVal = !map[key];
    setMap[key](newVal);
    setFlag(user.id, key, newVal);
    setShowMenu(false);
  }

  async function startCall(type: "audio" | "video") {
    setShowProfile(false);
    const supabase = createClient();
    const { data: { user: me } } = await supabase.auth.getUser();
    if (!me) return;
    const { data, error } = await supabase
      .from("calls")
      .insert({ caller_id: me.id, receiver_id: user.id, type, status: "ringing" })
      .select("id").single();
    if (error || !data) {
      router.push(`/call/dm-${user.id}?type=${type}&peerId=${user.id}`);
      return;
    }
    router.push(`/call/${data.id}?type=${type}&peerId=${user.id}`);
  }

  const menuItems = [
    {
      icon: Download, label: "Export Chat",
      action: () => { setShowMenu(false); router.push("/settings/backup"); },
      danger: false,
    },
    {
      icon: muted ? Volume2 : VolumeX,
      label: muted ? "Unmute Notifications" : "Mute Notifications",
      action: () => toggle("muted"), danger: false,
      active: muted,
    },
    {
      icon: Lock, label: locked ? "Unlock Chat" : "Lock Chat",
      action: () => toggle("locked"), danger: false,
      active: locked,
    },
    {
      icon: ShieldOff, label: restricted ? "Remove Restriction" : "Restrict User",
      action: () => toggle("restricted"), danger: !restricted,
      active: restricted,
    },
    {
      icon: Ban, label: blocked ? "Unblock User" : "Block User",
      action: () => toggle("blocked"), danger: !blocked,
      active: blocked,
    },
  ];

  return (
    <div className="relative">
      <div
        className="h-[72px] shrink-0 border-b themed-border px-6 flex items-center justify-between sticky top-0 z-10"
        style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}
      >
        {/* Left — clickable avatar+name opens profile */}
        <button
          className="flex items-center gap-4 cursor-pointer group text-left"
          onClick={() => setShowProfile(v => !v)}
        >
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
        </button>

        {/* Right — call buttons + triple dot */}
        <div className="flex items-center gap-2">
          <IconButton size="md" variant="ghost"
            className="themed-text-2 hover:text-[var(--brand-text)] hover:bg-[var(--row-hover-bg)]"
            tooltip="Audio Call" onClick={() => startCall("audio")}>
            <Phone size={20} />
          </IconButton>
          <IconButton size="md" variant="ghost"
            className="themed-text-2 hover:text-[var(--brand-text)] hover:bg-[var(--row-hover-bg)]"
            tooltip="Video Call" onClick={() => startCall("video")}>
            <Video size={20} />
          </IconButton>
          <div className="w-px h-6 mx-1" style={{ background: "var(--border)" }} />

          {/* ⋯ menu */}
          <div ref={menuRef} className="relative">
            <IconButton size="md" variant="ghost"
              className="themed-text-2 hover:themed-text"
              tooltip="More" onClick={() => setShowMenu(v => !v)}>
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
                    minWidth: 210,
                  }}
                >
                  {menuItems.map(({ icon: Icon, label, action, danger, active }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--row-hover-bg)]"
                      style={{ color: danger ? "var(--danger)" : active ? "var(--brand-text)" : "var(--text-primary)" }}
                    >
                      <Icon size={15} style={{ color: danger ? "var(--danger)" : active ? "var(--brand-text)" : "var(--text-muted)" }} />
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* User profile panel — slides in from right */}
      <UserProfilePanel
        peerId={user.id}
        open={showProfile}
        onClose={() => setShowProfile(false)}
        onAudioCall={() => startCall("audio")}
        onVideoCall={() => startCall("video")}
      />
    </div>
  );
}
