"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Hash, Lock, Users } from "lucide-react";
import { GroupPreview } from "@/features/dashboard/lib/mock-data";
import { Avatar } from "@/shared/components/Avatar";
import { RoleBadge } from "./RoleBadge";

interface GroupInfoModalProps {
  open: boolean;
  onClose: () => void;
  group: GroupPreview;
  members: { id: string; name: string; initials: string; isOnline: boolean; role?: "owner" | "admin" | "mod" | "member" }[];
  isPrivate?: boolean;
}

export function GroupInfoModal({ open, onClose, group, members, isPrivate = false }: GroupInfoModalProps) {
  const initials = group.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const online = members.filter(m => m.isOnline).length;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-sm rounded-2xl z-10"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-elevated)" }}
          >
            {/* Close button — positioned relative to whole modal, above banner */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}
            >
              <X size={15} />
            </button>

            {/* Gradient banner */}
            <div className="h-20 brand-grad rounded-t-2xl" />

            {/* Content */}
            <div className="px-5 pb-5">
              {/* Avatar + privacy row */}
              <div className="flex items-end justify-between -mt-8 mb-3">
                <div
                  className="w-16 h-16 rounded-2xl brand-grad flex items-center justify-center text-white text-xl font-bold"
                  style={{ border: "3px solid var(--surface)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
                >
                  {initials}
                </div>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-1"
                  style={{
                    background: isPrivate ? "var(--row-hover-bg)" : "rgba(34,197,94,0.12)",
                    color: isPrivate ? "var(--text-muted)" : "var(--success)",
                    border: `1px solid ${isPrivate ? "var(--border)" : "rgba(34,197,94,0.3)"}`,
                  }}
                >
                  {isPrivate ? <Lock size={10} /> : <Hash size={10} />}
                  {isPrivate ? "Private" : "Public"}
                </div>
              </div>

              {/* Name + stats */}
              <h2 className="text-lg font-bold themed-text mb-0.5">{group.name}</h2>
              <p className="text-xs themed-text-3 mb-4 flex items-center gap-1.5">
                <Users size={12} />
                {members.length} members
                <span className="mx-0.5">·</span>
                <span style={{ color: "var(--success)" }}>{online} online</span>
              </p>

              {/* Divider */}
              <div className="h-px mb-3" style={{ background: "var(--border)" }} />

              {/* Members */}
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Members</p>
              <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar -mx-1 px-1">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl hover:bg-[var(--row-hover-bg)] transition-colors">
                    <Avatar initials={m.initials} online={m.isOnline} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold themed-text truncate">{m.name}</p>
                      <p className="text-[10px]" style={{ color: m.isOnline ? "var(--success)" : "var(--text-muted)" }}>
                        {m.isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                    {m.role && m.role !== "member" && <RoleBadge role={m.role} />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
