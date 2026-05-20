"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/core/auth/supabase-client"

export interface DMConversation {
  id: string
  user: {
    id: string
    name: string
    initials: string
    isOnline: boolean
    avatarUrl?: string
    isVerified?: boolean
  }
  lastMessage: string
  lastMessageTime: string   // ISO — used for stable sort
  time: string
  unreadCount: number
}

export function useDMConversations() {
  const [conversations, setConversations] = useState<DMConversation[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Fetch latest messages per conversation + unread counts in one go
    const [{ data: messages }, { data: unreadRows }] = await Promise.all([
      supabase
        .from("direct_messages")
        .select(`
          id, content, created_at, sender_id, receiver_id, status,
          sender:profiles!direct_messages_sender_id_fkey(id, display_name, username, avatar_url, status),
          receiver:profiles!direct_messages_receiver_id_fkey(id, display_name, username, avatar_url, status)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(100),

      // Count unread messages received by me (status != 'read')
      supabase
        .from("direct_messages")
        .select("sender_id")
        .eq("receiver_id", user.id)
        .neq("status", "read"),
    ])

    if (!messages) { setLoading(false); return }

    // Build unread count map per sender
    const unreadMap: Record<string, number> = {}
    for (const row of (unreadRows || []) as any[]) {
      unreadMap[row.sender_id] = (unreadMap[row.sender_id] || 0) + 1
    }

    // Group by peer — first message per peer is the latest (already sorted DESC)
    const seen = new Set<string>()
    const convos: DMConversation[] = []

    for (const msg of messages as any[]) {
      const peer = msg.sender_id === user.id ? msg.receiver : msg.sender
      if (!peer || seen.has(peer.id)) continue
      seen.add(peer.id)

      const name: string = peer.display_name || peer.username || "Unknown"
      const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
      const createdAt: string = msg.created_at

      convos.push({
        id: peer.id,
        user: { id: peer.id, name, initials, isOnline: peer.status === "Online", avatarUrl: peer.avatar_url },
        lastMessage: msg.content || "📎 Media",
        lastMessageTime: createdAt,
        time: formatTime(createdAt),
        unreadCount: unreadMap[peer.id] || 0,
      })
    }

    // Sort: conversations with most recent message first
    convos.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())

    setConversations(convos)
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const suffix = Math.random().toString(36).slice(2)
    let activityChannel: ReturnType<typeof supabase.channel> | null = null

    // DB changes — picks up INSERT (new messages). UPDATE needs REPLICA IDENTITY FULL.
    const dbChannel = supabase
      .channel(`dm_list_${suffix}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, load)
      .subscribe()

    // Separate setup for the activity broadcast (needs async userId)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      activityChannel = supabase
        .channel(`dlite-user-${user.id}-activity`)
        .on("broadcast", { event: "chat-read" }, ({ payload }) => {
          // Instantly zero unread for the peer we just read — no DB round-trip needed
          setConversations(prev =>
            prev.map(c => c.id === payload.peerId ? { ...c, unreadCount: 0 } : c)
          )
        })
        .subscribe()
    })

    load()

    return () => {
      supabase.removeChannel(dbChannel)
      if (activityChannel) supabase.removeChannel(activityChannel)
    }
  }, [load])

  return { conversations, loading }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString([], { day: "numeric", month: "short" })
}
