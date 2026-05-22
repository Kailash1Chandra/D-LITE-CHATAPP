"use client";

import { useRouter } from "next/navigation";
import { Phone, Video, MoreVertical, Download, VolumeX, Volume2, Lock, ShieldOff, Ban, Star } from "lucide-react";
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
  const [muted,      setMutedState]      = useState(false);
  const [blocked,    setBlockedState]    = useState(false);
  const [restricted, setRestrictedState] = useState(false);
  const [locked,     setLockedState]     = useState(false);
  const [favourite,  setFavouriteState]  = useState(false);

  useEffect(() => {
    setMutedState(getFlag(user.id, "muted"));
    setBlockedState(getFlag(user.id, "blocked"));
    setRestrictedState(getFlag(user.id, "restricted"));
    setLockedState(getFlag(user.id, "locked"));
    setFavouriteState(getFlag(user.id, "favourite"));
  }, [user.id]);

  useEffect(() => {
    if (!showMenu) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showMenu]);

  function toggle(key: "muted" | "blocked" | "restricted" | "locked" | "favourite") {
    const map = { muted, blocked, restricted, locked, favourite };
    const setMap = { muted: setMutedState, blocked: setBlockedState, restricted: setRestrictedState, locked: setLockedState, favourite: setFavouriteState };
    const newVal = !map[key];
    setMap[key](newVal);
    setFlag(user.id, key, newVal);
    // Keep global favourites list in sync
    if (key === "favourite") {
      try {
        const existing: string[] = JSON.parse(localStorage.getItem("dlite_favourites") ?? "[]");
        const updated = newVal
          ? [...new Set([...existing, user.id])]
          : existing.filter(id => id !== user.id);
        localStorage.setItem("dlite_favourites", JSON.stringify(updated));
      } catch {}
    }
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
      icon: Star,
      label: favourite ? "Remove from Favourites" : "Add to Favourites",
      action: () => toggle("favourite" as any),
      danger: false,
      active: favourite,
    },
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
        className="h-[64px] shrink-0 border-b px-5 flex items-center justify-between sticky top-0 z-10"
        style={{
          background: "var(--header-bg)",
          borderColor: "var(--header-border)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        {/* Left — clickable avatar+name opens profile */}
        <button
          className="flex items-center gap-3 cursor-pointer group text-left min-w-0"
          onClick={() => setShowProfile(v => !v)}
        >
          <div className="relative shrink-0">
            <Avatar src={user.avatarUrl} initials={user.initials} online={false} verified={user.isVerified} size="md" />
            {/* Custom online dot for cleaner look */}
            {user.isOnline && (
              <span
                className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: "var(--success)", borderColor: "var(--header-bg)" }}
              />
            )}
          </div>
          <div className="min-w-0">
            <h3
              className="text-[15px] font-bold truncate transition-colors group-hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
            >
              {user.name}
            </h3>
            <div className="text-[12px] flex items-center gap-1 h-4">
              {isTyping ? (
                <div className="flex items-center gap-1" style={{ color: "var(--accent-purple)" }}>
                  <TypingDots /> <span className="italic">typing…</span>
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
        <div className="flex items-center gap-1">
          {/* Audio call pill button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startCall("audio")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors"
            style={{ color: "var(--text-muted)", background: "transparent" }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "var(--accent-purple)";
              e.currentTarget.style.background = "var(--row-hover-bg)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
            title="Audio Call"
          >
            <Phone size={17} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startCall("video")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors"
            style={{ color: "var(--text-muted)", background: "transparent" }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "var(--accent-purple)";
              e.currentTarget.style.background = "var(--row-hover-bg)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
            title="Video Call"
          >
            <Video size={17} />
          </motion.button>
          <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

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
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
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
