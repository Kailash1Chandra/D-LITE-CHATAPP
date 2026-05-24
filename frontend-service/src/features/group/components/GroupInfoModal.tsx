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
            className="relative w-full max-w-md rounded-2xl z-10 overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-elevated)" }}
          >
            {/* Header gradient banner */}
            <div className="h-24 brand-grad relative">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Avatar overlapping banner */}
            <div className="px-6 pb-6">
              <div className="-mt-10 mb-4 flex items-end justify-between">
                <div
                  className="w-20 h-20 rounded-2xl brand-grad flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                  style={{ border: "3px solid var(--surface)" }}
                >
                  {initials}
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: isPrivate ? "var(--row-hover-bg)" : "rgba(34,197,94,0.1)",
                    color: isPrivate ? "var(--text-muted)" : "var(--success)",
                    border: `1px solid ${isPrivate ? "var(--border)" : "rgba(34,197,94,0.3)"}`,
                  }}
                >
                  {isPrivate ? <Lock size={11} /> : <Hash size={11} />}
                  {isPrivate ? "Private" : "Public"}
                </div>
              </div>

              <h2 className="text-xl font-bold themed-text mb-1">{group.name}</h2>
              <p className="text-sm themed-text-3 mb-5 flex items-center gap-1.5">
                <Users size={13} />
                {members.length} members · <span style={{ color: "var(--success)" }}>{online} online</span>
              </p>

              {/* Members list */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                  Members
                </h4>
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar -mx-2 px-2">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-[var(--row-hover-bg)] transition-colors">
                      <Avatar initials={m.initials} online={m.isOnline} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold themed-text truncate">{m.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {m.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                      {m.role && m.role !== "member" && <RoleBadge role={m.role} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
