"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/core/auth/supabase-client";
import { Avatar } from "@/shared/components/Avatar";

interface FavPeer {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export function FavouriteChats() {
  const [peers, setPeers] = useState<FavPeer[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      let ids: string[] = [];
      try {
        ids = JSON.parse(localStorage.getItem("dlite_favourites") ?? "[]");
      } catch {}

      if (ids.length === 0) { setLoaded(true); return; }

      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, status")
        .in("id", ids);

      if (data) {
        setPeers(
          ids
            .map(id => {
              const p = (data as any[]).find(d => d.id === id);
              if (!p) return null;
              const name: string = p.display_name || p.username || "Unknown";
              return {
                id: p.id,
                name,
                initials: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
                avatarUrl: p.avatar_url ?? undefined,
                isOnline: p.status === "Online",
              };
            })
            .filter(Boolean) as FavPeer[]
        );
      }
      setLoaded(true);
    }
    load();
  }, []);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}
          >
            <Star size={13} className="text-white" fill="white" />
          </div>
          <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Favourite Chats</h3>
        </div>
        {peers.length > 0 && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
          >
            {peers.length}
          </span>
        )}
      </div>

      {/* Content */}
      {!loaded ? (
        <div className="flex gap-4 p-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0" style={{ width: 64 }}>
              <div className="w-14 h-14 rounded-full animate-pulse" style={{ background: "var(--row-hover-bg)" }} />
              <div className="h-2.5 w-10 rounded animate-pulse" style={{ background: "var(--row-hover-bg)" }} />
            </div>
          ))}
        </div>
      ) : peers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--row-hover-bg)" }}>
            <Star size={20} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No favourites yet</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Open a chat → ⋯ menu → Add to Favourites
          </p>
        </div>
      ) : (
        <div className="p-4 flex gap-5 overflow-x-auto custom-scrollbar">
          {peers.map((peer, i) => (
            <Link key={peer.id} href={`/chat/${peer.id}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
                style={{ width: 64 }}
              >
                <div className="relative">
                  <Avatar src={peer.avatarUrl} initials={peer.initials} online={peer.isOnline} size="lg" />
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)", boxShadow: "0 2px 6px rgba(234,88,12,0.4)" }}
                  >
                    <Star size={9} className="text-white" fill="white" />
                  </div>
                </div>
                <p className="text-[11px] font-medium text-center leading-tight w-full truncate" style={{ color: "var(--text-secondary)" }}>
                  {peer.name.split(" ")[0]}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
