"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Lock, Globe, Loader2 } from "lucide-react";
import { createClient } from "@/core/auth/supabase-client";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setLoading(false); return; }

    const { data: group, error: err } = await supabase
      .from("groups")
      .insert({ name: name.trim(), description: description.trim(), is_public: isPublic, created_by: user.id })
      .select()
      .single();

    if (err || !group) {
      const msg = err?.message ?? "Failed to create group";
      setError(msg.includes("violates row-level security")
        ? "Permission denied. Make sure you're logged in."
        : msg);
      setLoading(false);
      return;
    }

    const { error: memberErr } = await supabase
      .from("group_members")
      .insert({ group_id: (group as any).id, user_id: user.id, role: "Owner" });

    if (memberErr) {
      // Group was created but membership failed — delete orphan group and show error
      await supabase.from("groups").delete().eq("id", (group as any).id);
      setError("Failed to set up group membership. Please try again.");
      setLoading(false);
      return;
    }

    setName(""); setDescription(""); setIsPublic(false); setLoading(false);
    onClose();
    router.push(`/groups/${(group as any).id}`);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-md rounded-2xl p-6 z-10"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold themed-text">Create Group</h2>
            <button onClick={onClose} style={{ color: "var(--text-muted)" }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--row-hover-bg)] transition-colors">
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Group Name *</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Design Team"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)" }}
                onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
                onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
              <input
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="What is this group about?"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)" }}
                onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
                onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Privacy</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ val: false, icon: Lock, label: "Private" }, { val: true, icon: Globe, label: "Public" }].map(({ val, icon: Icon, label }) => (
                  <button key={label} onClick={() => setIsPublic(val)}
                    className="flex items-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all"
                    style={{
                      background: isPublic === val ? "var(--grad-brand)" : "var(--surface-2, var(--surface))",
                      borderColor: isPublic === val ? "transparent" : "var(--border)",
                      color: isPublic === val ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--surface-2, var(--surface))", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!name.trim() || loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Users size={14} /> Create Group</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
