"use client";

import { useState, useCallback } from "react";
import { Search, UserPlus, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/shared/components/Avatar";
import { createClient } from "@/core/auth/supabase-client";

const supabase = createClient();

interface ProfileResult {
  id: string;
  display_name: string | null;
  username: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  groupId: string;
  existingMemberIds: string[];
  onAdded?: () => void;
}

export function AddMemberModal({ open, onClose, groupId, existingMemberIds, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(10);
    const filtered = ((data as ProfileResult[]) || []).filter(
      (p) => !existingMemberIds.includes(p.id) && !added.has(p.id)
    );
    setResults(filtered);
  }, [existingMemberIds, added]);

  async function addMember(profile: ProfileResult) {
    setAdding(profile.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdding(null); return; }

    // Send an invite — the user must accept before being added to group_members
    await supabase.from("group_invites").upsert(
      { group_id: groupId, invited_user_id: profile.id, invited_by: user.id, status: "pending" },
      { onConflict: "group_id,invited_user_id" }
    );

    setAdded((prev) => new Set([...prev, profile.id]));
    setResults((prev) => prev.filter((r) => r.id !== profile.id));
    setAdding(null);
  }

  function handleClose() {
    setQuery(""); setResults([]); setAdded(new Set());
    onClose();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-sm rounded-2xl p-6 z-10"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold themed-text">Invite Members</h2>
            <button onClick={handleClose} style={{ color: "var(--text-muted)" }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--row-hover-bg)] transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              autoFocus
              placeholder="Search by name or username…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)" }}
              onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
              onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
            />
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
            {query.length >= 2 && results.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>No users found</p>
            )}
            {results.map((profile) => {
              const name = profile.display_name || profile.username || "Unknown";
              const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={profile.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--row-hover-bg)] transition-colors">
                  <Avatar initials={initials} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold themed-text truncate">{name}</p>
                    {profile.username && <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{profile.username}</p>}
                  </div>
                  <button
                    onClick={() => addMember(profile)}
                    disabled={adding === profile.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: "var(--grad-brand)" }}
                  >
                    {adding === profile.id ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus size={12} />}
                    {adding === profile.id ? "…" : "Invite"}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
