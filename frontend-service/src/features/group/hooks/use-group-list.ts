"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/core/auth/supabase-client"

export interface GroupListItem {
  id: string
  name: string
  initials: string
  lastMessage: string
  time: string
  unreadCount: number
  isMuted: boolean
}

export function useGroupList() {
  const [groups, setGroups] = useState<GroupListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Step 1: get groups the user belongs to (simple query, no nested join)
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, groups(id, name)")
        .eq("user_id", user.id)

      if (!memberships?.length) { setGroups([]); setLoading(false); return }

      const groupIds = memberships.map((m: any) => m.group_id).filter(Boolean)

      // Step 2: get the latest message per group (separate flat query)
      const { data: messages } = await supabase
        .from("group_messages")
        .select("group_id, content, created_at")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(groupIds.length * 3)

      // Build a map: groupId → latest message
      const lastMsgMap = new Map<string, { content: string; created_at: string }>()
      for (const msg of (messages ?? []) as any[]) {
        if (!lastMsgMap.has(msg.group_id)) {
          lastMsgMap.set(msg.group_id, msg)
        }
      }

      const items: GroupListItem[] = memberships.flatMap((m: any) => {
        const g = m.groups
        if (!g) return []
        const name: string = g.name || "Unnamed Group"
        const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
        const last = lastMsgMap.get(g.id)
        let isMuted = false
        try { isMuted = localStorage.getItem(`dlite_group_${g.id}_muted`) === "1" } catch {}
        return [{
          id: g.id,
          name,
          initials,
          lastMessage: last?.content || "No messages yet",
          time: last ? new Date(last.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
          unreadCount: 0,
          isMuted,
        }]
      })

      setGroups(items)
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel("group_list_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "group_messages" }, load)
      // Reload when user joins/leaves a group (catches new group creation too)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { groups, loading }
}
