"use client"

import * as React from "react"
import { createClient } from "@/core/auth/supabase-client"

export interface Message {
  id: string
  content: string
  mediaUrl?: string
  isOwn: boolean
  time: string
  status?: "sending" | "sent" | "delivered" | "read" | "failed"
  replyTo?: { id: string; content: string; sender: string }
  reactions?: { emoji: string; count: number; reacted: boolean }[]
  type?: "text" | "audio" | "image"
  edited?: boolean
}

interface UseChatMessagesReturn {
  messages: Message[]
  send: (content: string, mediaUrl?: string, replyToId?: string) => void
  addReaction: (messageId: string, emoji: string) => void
  deleteMessage: (id: string) => void
  editMessage: (id: string, newContent: string) => void
  loading: boolean
}

function toMessage(raw: any, currentUserId: string): Message {
  const reactions = raw.reactions || []
  const grouped: Record<string, { count: number; reacted: boolean }> = {}
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, reacted: false }
    grouped[r.emoji].count++
    if (r.user_id === currentUserId) grouped[r.emoji].reacted = true
  }

  return {
    id: raw.id,
    content: raw.content || "",
    mediaUrl: raw.media_url ?? undefined,
    isOwn: raw.sender_id === currentUserId,
    time: new Date(raw.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    status: raw.status as Message["status"],
    reactions: Object.entries(grouped).map(([emoji, { count, reacted }]) => ({ emoji, count, reacted })),
    replyTo: undefined,
  }
}

export function useChatMessages(peerId: string): UseChatMessagesReturn {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(true)
  const userIdRef = React.useRef<string | null>(null)

  const loadMessages = React.useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    userIdRef.current = user.id

    const { data: rawMessages } = await supabase
      .from("direct_messages")
      .select(`
        id, content, media_url, status, created_at, sender_id, receiver_id, reply_to_id,
        reactions:message_reactions(emoji, user_id)
      `)
      // Use in() filter — works on all PostgREST versions, avoids and() inside or()
      .in("sender_id", [user.id, peerId])
      .in("receiver_id", [user.id, peerId])
      .order("created_at", { ascending: true })

    if (rawMessages) {
      setMessages(rawMessages.map((m) => toMessage(m, user.id)))
    }
    setLoading(false)

    // Mark received messages as read
    await supabase
      .from("direct_messages")
      .update({ status: "read" })
      .eq("sender_id", peerId)
      .eq("receiver_id", user.id)
      .neq("status", "read")
  }, [peerId])

  React.useEffect(() => {
    loadMessages()

    const supabase = createClient()
    const channel = supabase
      .channel(`dm-thread-${peerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, loadMessages)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, loadMessages)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [peerId, loadMessages])

  const send = React.useCallback(async (content: string, mediaUrl?: string, replyToId?: string) => {
    const userId = userIdRef.current
    if (!userId) return
    const supabase = createClient()

    const optimisticId = `opt-${Date.now()}`
    const optimistic: Message = {
      id: optimisticId,
      content,
      mediaUrl,
      isOwn: true,
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      status: "sending",
    }
    setMessages((prev) => [...prev, optimistic])

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: userId, receiver_id: peerId, content, media_url: mediaUrl || null, reply_to_id: replyToId || null, status: "sent" })
      .select()
      .single()

    if (error) {
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...m, status: "failed" } : m))
    } else {
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...m, id: data.id, status: "sent" } : m))
    }
  }, [peerId])

  const addReaction = React.useCallback(async (messageId: string, emoji: string) => {
    const userId = userIdRef.current
    if (!userId) return
    const supabase = createClient()

    const msg = messages.find((m) => m.id === messageId)
    const alreadyReacted = msg?.reactions?.find((r) => r.emoji === emoji && r.reacted)

    if (alreadyReacted) {
      await supabase.from("message_reactions").delete()
        .eq("message_id", messageId).eq("user_id", userId).eq("emoji", emoji)
    } else {
      await supabase.from("message_reactions").upsert({ message_id: messageId, user_id: userId, emoji })
    }
  }, [messages])

  const deleteMessage = React.useCallback(async (id: string) => {
    const userId = userIdRef.current
    if (!userId) return
    setMessages((prev) => prev.filter((m) => m.id !== id))
    const supabase = createClient()
    await supabase.from("direct_messages").delete().eq("id", id).eq("sender_id", userId)
  }, [])

  const editMessage = React.useCallback(async (id: string, newContent: string) => {
    const userId = userIdRef.current
    if (!userId) return
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: newContent } : m))
    const supabase = createClient()
    await supabase.from("direct_messages").update({ content: newContent }).eq("id", id).eq("sender_id", userId)
  }, [])

  return { messages, send, addReaction, deleteMessage, editMessage, loading }
}
