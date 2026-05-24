"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Ban, Lock, ShieldOff, VolumeX } from "lucide-react";

export type ChatFlag = "blocked" | "locked" | "restricted" | "muted" | "blockedByPeer";

interface BannerConfig {
  icon: typeof Ban;
  bg: string;
  border: string;
  iconColor: string;
  text: string;
  actionLabel?: string; // undefined = no action button (can't be reversed by this user)
}

const CONFIG: Record<ChatFlag, BannerConfig> = {
  blocked: {
    icon: Ban,
    bg: "rgba(239,68,68,0.2)",
    border: "rgba(239,68,68,0.2)",
    iconColor: "var(--danger)",
    text: "You've blocked this contact. They can't message you.",
    actionLabel: "Unblock",
  },
  blockedByPeer: {
    icon: Ban,
    bg: "rgba(239,68,68,0.2)",
    border: "rgba(239,68,68,0.2)",
    iconColor: "var(--danger)",
    text: "This user has blocked you. You can't send messages.",
  },
  locked: {
    icon: Lock,
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.2)",
    iconColor: "#f59e0b",
    text: "This chat is locked. Only you can see these messages.",
    actionLabel: "Unlock",
  },
  restricted: {
    icon: ShieldOff,
    bg: "rgba(99,102,241,0.32)",
    border: "rgba(99,102,241,0.32)",
    iconColor: "var(--accent-purple)",
    text: "You've restricted this contact. They can't see your status or online time.",
    actionLabel: "Remove restriction",
  },
  muted: {
    icon: VolumeX,
    bg: "rgba(107,114,128,0.07)",
    border: "rgba(107,114,128,0.2)",
    iconColor: "var(--text-muted)",
    text: "Notifications muted for this chat.",
    actionLabel: "Unmute",
  },
};

interface Props {
  flags: Partial<Record<ChatFlag, boolean>>;
  onAction: (flag: ChatFlag) => void;
}

export function ChatStatusBanner({ flags, onAction }: Props) {
  const active = (Object.keys(CONFIG) as ChatFlag[]).filter(f => flags[f]);

  return (
    <AnimatePresence initial={false}>
      {active.map(flag => {
        const c = CONFIG[flag];
        const Icon = c.icon;
        return (
          <motion.div
            key={flag}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-3 mx-4 mt-2 px-3 py-2 rounded-xl text-sm"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}
            >
              <Icon size={14} style={{ color: c.iconColor, flexShrink: 0 }} />
              <span className="flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {c.text}
              </span>
              {c.actionLabel && (
                <button
                  onClick={() => onAction(flag)}
                  className="text-xs font-semibold px-2 py-0.5 rounded-lg transition-colors shrink-0"
                  style={{ color: c.iconColor, background: c.border }}
                >
                  {c.actionLabel}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
