"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Phone, Video, MoreVertical, Hash, Lock, BellOff, Bell, LogOut } from "lucide-react";
import { IconButton } from "@/shared/components/IconButton";
import { StackedAvatar } from "./StackedAvatar";
import { Pill } from "@/shared/components/Pill";
import { AnimatePresence, motion } from "framer-motion";
import { GroupPreview } from "@/features/dashboard/lib/mock-data";

export interface GroupHeaderProps {
  group: GroupPreview;
  isPrivate?: boolean;
  onLeave?: () => void;
  onInfoClick?: () => void;
}

export function GroupHeader({ group, isPrivate = false, onLeave, onInfoClick }: GroupHeaderProps) {
  const router = useRouter();
  const onlineCount = group.members.filter(m => m.isOnline).length;
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setIsMuted(localStorage.getItem(`dlite_group_${group.id}_muted`) === "1"); } catch {}
  }, [group.id]);

  useEffect(() => {
    if (!showMenu) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showMenu]);

  function toggleMute() {
    const next = !isMuted;
    setIsMuted(next);
    try { localStorage.setItem(`dlite_group_${group.id}_muted`, next ? "1" : "0"); } catch {}
    window.dispatchEvent(new CustomEvent("dlite:group-mute-change", { detail: { groupId: group.id, muted: next } }));
    setShowMenu(false);
  }

  function startCall(type: "audio" | "video") {
    router.push(`/call/group-${group.id}?type=${type}&groupId=${group.id}`);
  }

  return (
    <div
      className="h-[72px] shrink-0 border-b px-6 flex items-center justify-between sticky top-0 z-10"
      style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}
    >
      <div className="flex items-center gap-4 cursor-pointer group" onClick={onInfoClick}>
        {(group.avatarUrl || group.avatarBg) ? (
          <div
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 text-white text-xs font-bold"
            style={{ background: group.avatarBg || "var(--grad-brand)" }}
          >
            {group.avatarUrl
              ? <img src={group.avatarUrl} className="w-[85%] h-[85%] rounded-lg object-cover" alt="" />
              : group.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <StackedAvatar members={group.members} max={3} />
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold themed-text group-hover:text-[var(--brand-text)] transition-colors">
              {group.name}
            </h3>
            <Pill variant={isPrivate ? "neutral" : "success"} className="text-[10px] px-1.5 py-0 h-4 flex items-center gap-1">
              {isPrivate ? <Lock size={10} /> : <Hash size={10} />}
              {isPrivate ? "Private" : "Public"}
            </Pill>
            {isMuted && <BellOff size={12} style={{ color: "var(--text-muted)" }} />}
          </div>
          <div className="text-xs flex items-center h-4 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            <span style={{ color: "var(--success)" }} className="font-medium">{onlineCount} online</span>
            <span className="mx-1.5">·</span>
            <span>{group.members.length} members</span>
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
          <IconButton size="md" variant="ghost" className="themed-text-2 hover:themed-text" tooltip="More" onClick={() => setShowMenu(v => !v)}>
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
                  minWidth: 200,
                }}
              >
                <button
                  onClick={toggleMute}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--row-hover-bg)]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {isMuted
                    ? <Bell size={15} style={{ color: "var(--text-muted)" }} />
                    : <BellOff size={15} style={{ color: "var(--text-muted)" }} />}
                  {isMuted ? "Unmute Notifications" : "Mute Notifications"}
                </button>
                {onLeave && (
                  <button
                    onClick={() => { setShowMenu(false); onLeave(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[rgba(239,68,68,0.08)]"
                    style={{ color: "var(--danger)" }}
                  >
                    <LogOut size={15} style={{ color: "var(--danger)" }} />
                    Leave Group
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
