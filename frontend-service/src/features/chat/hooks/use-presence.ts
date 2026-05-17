"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/core/auth/supabase-client"

// Returns set of online user IDs using Supabase Realtime Presence
// Also keeps the current user's status updated in their profile

export function usePresence() {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let userId: string | null = null

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id

      // Mark online in profiles table
      await supabase
        .from("profiles")
        .update({ status: "Online", last_seen_at: new Date().toISOString() })
        .eq("id", userId)

      const channel = supabase.channel("global_presence", {
        config: { presence: { key: userId } },
      })

      channelRef.current = channel

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState<{ user_id: string }>()
          const ids = new Set(Object.keys(state))
          setOnlineIds(ids)
        })
        .on("presence", { event: "join" }, ({ key }) => {
          setOnlineIds(prev => new Set([...prev, key]))
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          setOnlineIds(prev => { const n = new Set(prev); n.delete(key); return n })
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ user_id: userId, online_at: Date.now() })
          }
        })
    }

    init()

    // Mark offline on unload
    const markOffline = async () => {
      if (userId) {
        await supabase
          .from("profiles")
          .update({ status: "Offline", last_seen_at: new Date().toISOString() })
          .eq("id", userId)
      }
    }
    window.addEventListener("beforeunload", markOffline)

    return () => {
      window.removeEventListener("beforeunload", markOffline)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      markOffline()
    }
  }, [])

  return { onlineIds, isOnline: (id: string) => onlineIds.has(id) }
}
