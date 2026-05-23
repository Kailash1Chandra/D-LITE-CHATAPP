"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Ban, Lock, ShieldOff, VolumeX, X } from "lucide-react";

export type ChatFlag = "blocked" | "locked" | "restricted" | "muted";

interface BannerConfig {
  icon: typeof Ban;
  bg: string;
  border: string;
  iconColor: string;
  text: string;
  actionLabel: string;
}

const CONFIG: Record<ChatFlag, BannerConfig> = {
  blocked: {
    icon: Ban,
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
    iconColor: "var(--danger)",
    text: "You've blocked this contact. They can't message you.",
    actionLabel: "Unblock",
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
    bg: "rgba(99,102,241,0.07)",
    border: "rgba(99,102,241,0.2)",
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
  const active = (Object.keys(flags) as ChatFlag[]).filter(f => flags[f]);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 px-4 pt-2">
      <AnimatePresence>
        {active.map(flag => {
          const c = CONFIG[flag];
          const Icon = c.icon;
          return (
            <motion.div
              key={flag}
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}
            >
              <Icon size={14} style={{ color: c.iconColor, flexShrink: 0 }} />
              <span className="flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {c.text}
              </span>
              <button
                onClick={() => onAction(flag)}
                className="text-xs font-semibold px-2 py-0.5 rounded-lg transition-colors shrink-0"
                style={{ color: c.iconColor, background: c.border }}
              >
                {c.actionLabel}
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
