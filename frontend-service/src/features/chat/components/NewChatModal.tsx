"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MessageSquare, Loader2 } from "lucide-react";
import { createClient } from "@/core/auth/supabase-client";

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string | null;
}

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewChatModal({ open, onClose }: NewChatModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const q = query.trim().toLowerCase();
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, status")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .neq("id", currentUserId ?? "")
        .limit(8);

      setResults((data as UserResult[]) ?? []);
      setLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, currentUserId]);

  function startChat(userId: string) {
    onClose();
    router.push(`/chat/${userId}`);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -12 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden z-10"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          {/* Search bar */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Search size={18} style={{ color: "var(--text-muted)" }} className="shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or username…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text-primary)" }}
            />
            {loading
              ? <Loader2 size={16} className="animate-spin shrink-0" style={{ color: "var(--text-muted)" }} />
              : query
                ? <button onClick={() => setQuery("")} style={{ color: "var(--text-muted)" }}>
                    <X size={16} />
                  </button>
                : null
            }
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {results.length > 0 ? (
              results.map(user => {
                const name = user.display_name || user.username || "Unknown";
                const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                const isOnline = user.status === "Online";

                return (
                  <button
                    key={user.id}
                    onClick={() => startChat(user.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--row-hover-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: "var(--grad-brand)" }}
                        >
                          {initials}
                        </div>
                      )}
                      {isOnline && (
                        <span
                          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                          style={{ background: "var(--success)", borderColor: "var(--surface)" }}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        @{user.username}
                      </p>
                    </div>

                    <MessageSquare size={15} style={{ color: "var(--brand-text)" }} />
                  </button>
                );
              })
            ) : query && !loading ? (
              <div className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No users found for &quot;{query}&quot;
              </div>
            ) : !query ? (
              <div className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Type a name or username to search
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
