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

    const { data: messages } = await supabase
      .from("direct_messages")
      .select(`
        id, content, created_at, sender_id, receiver_id,
        sender:profiles!direct_messages_sender_id_fkey(id, display_name, username, avatar_url, status),
        receiver:profiles!direct_messages_receiver_id_fkey(id, display_name, username, avatar_url, status)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (!messages) { setLoading(false); return }

    const seen = new Set<string>()
    const convos: DMConversation[] = []

    for (const msg of messages as any[]) {
      const peer = msg.sender_id === user.id ? msg.receiver : msg.sender
      if (!peer || seen.has(peer.id)) continue
      seen.add(peer.id)

      const name: string = peer.display_name || peer.username || "Unknown"
      const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()

      convos.push({
        id: peer.id,
        user: { id: peer.id, name, initials, isOnline: peer.status === "Online", avatarUrl: peer.avatar_url },
        lastMessage: msg.content || "",
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        unreadCount: 0,
      })
    }

    setConversations(convos)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    const supabase = createClient()
    // Unique channel name prevents React StrictMode double-mount conflicts
    const channelName = `dm_list_${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  return { conversations, loading }
}
