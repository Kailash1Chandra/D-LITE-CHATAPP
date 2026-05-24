"use client";

import { useEffect, useState } from "react";
import { X, Phone, Video, MessageSquare, Calendar, AtSign, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/core/auth/supabase-client";
import { Avatar } from "@/shared/components/Avatar";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: string;
  joinedAt?: string;
}

interface SharedMedia {
  url: string;
  id: string;
}

interface Props {
  peerId: string;
  open: boolean;
  onClose: () => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
}

function formatLastSeen(iso?: string) {
  if (!iso) return "a while ago";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UserProfilePanel({ peerId, open, onClose, onAudioCall, onVideoCall }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [media, setMedia] = useState<SharedMedia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !peerId) return;
    setLoading(true);
    const supabase = createClient();

    Promise.all([
      supabase.from("profiles")
        .select("id, display_name, username, avatar_url, status, last_seen_at, created_at")
        .eq("id", peerId)
        .single(),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return { data: [] };
        return supabase
          .from("direct_messages")
          .select("id, media_url")
          .not("media_url", "is", null)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: false })
          .limit(9);
      }),
    ]).then(([profileRes, mediaRes]) => {
      const d = profileRes.data as any;
      if (d) {
        setProfile({
          id: d.id,
          name: d.display_name || d.username || "Unknown",
          username: d.username || "",
          bio: d.bio || undefined,
          avatarUrl: d.avatar_url || undefined,
          isOnline: d.status === "Online",
          lastSeen: d.last_seen_at,
          joinedAt: d.created_at,
        });
      }
      const imgs = ((mediaRes as any).data || [])
        .filter((m: any) => m.media_url)
        .map((m: any) => ({ id: m.id, url: m.media_url }));
      setMedia(imgs);
      setLoading(false);
    });
  }, [open, peerId]);

  const initials = profile?.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "…";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20" style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={onClose} />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="absolute right-0 top-0 bottom-0 z-30 flex flex-col overflow-hidden"
            style={{
              width: 320,
              background: "var(--surface-elevated)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.55)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>User Info</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={onAudioCall}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--brand-text)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                  title="Audio Call"
                >
                  <Phone size={16} />
                </button>
                <button
                  onClick={onVideoCall}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--brand-text)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                  title="Video Call"
                >
                  <Video size={16} />
                </button>
                <div className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--brand-text)", borderTopColor: "transparent" }} />
                </div>
              ) : profile ? (
                <>
                  {/* Avatar + name */}
                  <div className="flex flex-col items-center py-8 px-5 border-b" style={{ borderColor: "var(--border)" }}>
                    <div className="relative mb-4">
                      <Avatar initials={initials} size="xl" src={profile.avatarUrl} />
                      <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2"
                        style={{ background: profile.isOnline ? "var(--success)" : "var(--text-muted)", borderColor: "var(--surface)" }} />
                    </div>
                    <h2 className="text-xl font-bold themed-text text-center">{profile.name}</h2>
                    {profile.username && (
                      <p className="text-sm themed-text-3 mt-0.5">@{profile.username}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: profile.isOnline ? "var(--success)" : "var(--text-muted)" }}>
                      {profile.isOnline ? "Online" : `Last seen ${formatLastSeen(profile.lastSeen)}`}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-center gap-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
                    {[
                      { icon: Phone, label: "Audio", action: onAudioCall },
                      { icon: Video, label: "Video", action: onVideoCall },
                    ].map(({ icon: Icon, label, action }) => (
                      <button key={label} onClick={action}
                        className="flex flex-col items-center gap-1.5 group">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
                          style={{ background: "rgba(128,128,128,0.3)", border: "1px solid var(--border)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(128,128,128,0.3)"}
                        >
                          <Icon size={18} style={{ color: "var(--brand-text)" }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <div className="px-5 py-4 border-b">
                      <div className="flex items-start gap-3">
                        <Info size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <div>
                          <p className="text-xs themed-text-3 mb-0.5">Bio</p>
                          <p className="text-sm themed-text">{profile.bio}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Username */}
                  {profile.username && (
                    <div className="px-5 py-4 border-b">
                      <div className="flex items-center gap-3">
                        <AtSign size={16} style={{ color: "var(--text-muted)" }} />
                        <div>
                          <p className="text-xs themed-text-3 mb-0.5">Username</p>
                          <p className="text-sm themed-text">@{profile.username}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Joined */}
                  {profile.joinedAt && (
                    <div className="px-5 py-4 border-b">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} style={{ color: "var(--text-muted)" }} />
                        <div>
                          <p className="text-xs themed-text-3 mb-0.5">Member since</p>
                          <p className="text-sm themed-text">
                            {new Date(profile.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shared media */}
                  {media.length > 0 && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold themed-text-3 uppercase tracking-wider mb-3">
                        Shared Media ({media.length})
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {media.map(m => (
                          <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer">
                            <img src={m.url} alt="media" className="w-full aspect-square object-cover rounded-lg" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
