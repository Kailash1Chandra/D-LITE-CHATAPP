"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Lock, Globe, Loader2, Search, Check } from "lucide-react";
import { createClient } from "@/core/auth/supabase-client";
import { Avatar } from "@/shared/components/Avatar";

interface ProfileResult {
  id: string;
  display_name: string | null;
  username: string | null;
}

interface SelectedMember {
  id: string;
  name: string;
  initials: string;
}

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

  // Member search state
  const [memberQuery, setMemberQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileResult[]>([]);
  const [selected, setSelected] = useState<SelectedMember[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchMembers = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSearchResults([]); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(8);
    setSearchResults((data as ProfileResult[] || []).filter(p => !selected.some(s => s.id === p.id)));
  }, [selected]);

  function onMemberQueryChange(q: string) {
    setMemberQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchMembers(q), 250);
  }

  function toggleMember(profile: ProfileResult) {
    const name = profile.display_name || profile.username || "Unknown";
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const already = selected.some(s => s.id === profile.id);
    if (already) {
      setSelected(prev => prev.filter(s => s.id !== profile.id));
    } else {
      setSelected(prev => [...prev, { id: profile.id, name, initials }]);
    }
    setSearchResults(prev => prev.filter(r => r.id !== profile.id || already));
  }

  function removeSelected(id: string) {
    setSelected(prev => prev.filter(s => s.id !== id));
  }

  function reset() {
    setName(""); setDescription(""); setIsPublic(false);
    setMemberQuery(""); setSearchResults([]); setSelected([]);
    setError(null);
  }

  function handleClose() { reset(); onClose(); }

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setLoading(false); return; }

    const groupId = crypto.randomUUID();

    const { error: err } = await supabase
      .from("groups")
      .insert({ id: groupId, name: name.trim(), description: description.trim(), is_public: isPublic, created_by: user.id });

    if (err) {
      const msg = err.message;
      setError(msg.includes("violates row-level security") ? "Permission denied. Make sure you're logged in." : msg);
      setLoading(false);
      return;
    }

    // Add owner + all selected members in one batch
    const membersToInsert = [
      { group_id: groupId, user_id: user.id, role: "Owner" },
      ...selected.map(m => ({ group_id: groupId, user_id: m.id, role: "Member" })),
    ];

    const { error: memberErr } = await supabase.from("group_members").insert(membersToInsert);

    if (memberErr) {
      await supabase.from("groups").delete().eq("id", groupId);
      setError("Failed to set up group membership. Please try again.");
      setLoading(false);
      return;
    }

    reset();
    setLoading(false);
    window.dispatchEvent(new CustomEvent("dlite:group-created", { detail: { groupId } }));
    onClose();
    router.push(`/groups/${groupId}`);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md rounded-2xl p-6 z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold themed-text">Create Group</h2>
            <button onClick={handleClose} style={{ color: "var(--text-muted)" }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--row-hover-bg)] transition-colors">
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.22)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
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

            {/* Description */}
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

            {/* Privacy */}
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

            {/* Add Members */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                Add Members <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </label>

              {/* Selected chips */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selected.map(m => (
                    <span
                      key={m.id}
                      className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "var(--row-hover-bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      <Avatar initials={m.initials} size="sm" />
                      {m.name}
                      <button onClick={() => removeSelected(m.id)} className="ml-0.5 opacity-60 hover:opacity-100">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                <input
                  value={memberQuery}
                  onChange={e => onMemberQueryChange(e.target.value)}
                  placeholder="Search by name or username…"
                  className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
                  style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
                  onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
                />
              </div>

              {searchResults.length > 0 && (
                <div className="mt-1.5 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                  {searchResults.map(profile => {
                    const n = profile.display_name || profile.username || "Unknown";
                    const initials = n.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                    const isSelected = selected.some(s => s.id === profile.id);
                    return (
                      <button
                        key={profile.id}
                        onClick={() => toggleMember(profile)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-[var(--row-hover-bg)]"
                      >
                        <Avatar initials={initials} size="sm" />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-semibold themed-text truncate">{n}</p>
                          {profile.username && <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{profile.username}</p>}
                        </div>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: isSelected ? "var(--grad-brand)" : "var(--row-hover-bg)",
                            border: `1.5px solid ${isSelected ? "transparent" : "var(--border)"}`,
                          }}
                        >
                          {isSelected && <Check size={11} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {memberQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>No users found</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--surface-2, var(--surface))", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!name.trim() || loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : <><Users size={14} /> Create{selected.length > 0 ? ` with ${selected.length + 1}` : ""}</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
