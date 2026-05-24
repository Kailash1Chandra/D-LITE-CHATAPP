"use client"

import * as React from "react"
import { createClient } from "@/core/auth/supabase-client"
import type { GroupPreview, User } from "@/features/dashboard/lib/mock-data"

export interface GroupMessage {
  id: string
  direction: "in" | "out"
  authorName: string
  role: "owner" | "admin" | "mod" | "member"
  content: string
  mediaUrl?: string
  time: string
  dateStr?: string
  reactions?: { emoji: string; count: number; reacted: boolean }[]
}

interface UseGroupMessagesReturn {
  group: GroupPreview | null
  members: (User & { role: "owner" | "admin" | "mod" | "member" })[]
  messages: GroupMessage[]
  send: (content: string, mediaUrl?: string) => void
  addReaction: (messageId: string, emoji: string) => void
  deleteMessage: (id: string) => void
  editMessage: (id: string, newContent: string) => void
  leaveGroup: () => Promise<void>
  loading: boolean
  currentUserId: string | null
  currentUserRole: "owner" | "admin" | "mod" | "member" | null
  reload: () => void
}

function groupReactions(raw: any[], userId: string) {
  const map: Record<string, { count: number; reacted: boolean }> = {}
  for (const r of raw) {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, reacted: false }
    map[r.emoji].count++
    if (r.user_id === userId) map[r.emoji].reacted = true
  }
  return Object.entries(map).map(([emoji, { count, reacted }]) => ({ emoji, count, reacted }))
}

export function useGroupMessages(groupId: string): UseGroupMessagesReturn {
  const [group, setGroup] = React.useState<GroupPreview | null>(null)
  const [members, setMembers] = React.useState<(User & { role: "owner" | "admin" | "mod" | "member" })[]>([])
  const [messages, setMessages] = React.useState<GroupMessage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = React.useState<"owner" | "admin" | "mod" | "member" | null>(null)
  const userIdRef = React.useRef<string | null>(null)

  const load = React.useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    userIdRef.current = user.id
    setCurrentUserId(user.id)

    const [groupRes, membersRes, msgRes] = await Promise.all([
      supabase.from("groups").select("id, name").eq("id", groupId).single(),
      supabase
        .from("group_members")
        .select("role, user_id, profile:profiles(id, display_name, username, status)")
        .eq("group_id", groupId),
      supabase
        .from("group_messages")
        .select("id, content, media_url, created_at, sender_id, sender:profiles(id, display_name, username), reactions:group_message_reactions(emoji, user_id)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true }),
    ])

    if (groupRes.data) {
      const g = groupRes.data as any
      const rawMembers = ((membersRes.data || []) as any[]).map((m): User & { role: "owner" | "admin" | "mod" | "member" } => {
        const p = m.profile
        const name: string = p.display_name || p.username || "?"
        const dbRole: string = m.role || "Member"
        const role = dbRole === "Owner" ? "owner" : dbRole === "Admin" ? "admin" : dbRole === "Moderator" ? "mod" : "member"
        if (p.id === user.id) setCurrentUserRole(role)
        return {
          id: p.id,
          name,
          initials: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
          isOnline: p.status === "Online",
          role,
        }
      })
      setMembers(rawMembers)
      setGroup({
        id: g.id,
        name: g.name || "Group",
        members: rawMembers.slice(0, 3),
        lastMessage: "",
        time: "",
        unreadCount: 0,
      })
    }

    if (msgRes.data) {
      let lastDate = ""
      setMessages(
        (msgRes.data as any[]).map((m) => {
          const sender = m.sender as any
          const name: string = sender?.display_name || sender?.username || "Unknown"
          const dateStr = new Date(m.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
          const showDate = dateStr !== lastDate
          lastDate = dateStr
          return {
            id: m.id,
            direction: m.sender_id === user.id ? "out" : "in",
            authorName: m.sender_id === user.id ? "You" : name,
            role: "member",
            content: m.content || "",
            mediaUrl: m.media_url ?? undefined,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            dateStr: showDate ? dateStr : undefined,
            reactions: groupReactions(m.reactions || [], user.id),
          } as GroupMessage
        })
      )
    }

    setLoading(false)
  }, [groupId])

  React.useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_message_reactions" }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [groupId, load])

  const send = React.useCallback(async (content: string, mediaUrl?: string) => {
    const userId = userIdRef.current
    if (!userId) return
    const supabase = createClient()
    await supabase.from("group_messages").insert({
      group_id: groupId,
      sender_id: userId,
      content,
      media_url: mediaUrl || null,
    })
  }, [groupId])

  const addReaction = React.useCallback(async (messageId: string, emoji: string) => {
    const userId = userIdRef.current
    if (!userId) return
    const supabase = createClient()

    const msg = messages.find(m => m.id === messageId)
    const alreadyReacted = !!msg?.reactions?.find(r => r.emoji === emoji && r.reacted)

    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m
      const existing = m.reactions ?? []
      if (alreadyReacted) {
        return { ...m, reactions: existing.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r).filter(r => r.count > 0) }
      }
      const found = existing.find(r => r.emoji === emoji)
      if (found) return { ...m, reactions: existing.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r) }
      return { ...m, reactions: [...existing, { emoji, count: 1, reacted: true }] }
    }))

    if (alreadyReacted) {
      await supabase.from("group_message_reactions").delete()
        .eq("message_id", messageId).eq("user_id", userId).eq("emoji", emoji)
    } else {
      await supabase.from("group_message_reactions")
        .upsert({ message_id: messageId, user_id: userId, emoji }, { ignoreDuplicates: true })
    }
  }, [messages])

  const deleteMessage = React.useCallback(async (id: string) => {
    const userId = userIdRef.current
    if (!userId) return
    setMessages(prev => prev.filter(m => m.id !== id))
    const supabase = createClient()
    await supabase.from("group_messages").delete().eq("id", id).eq("sender_id", userId)
  }, [])

  const editMessage = React.useCallback(async (id: string, newContent: string) => {
    const userId = userIdRef.current
    if (!userId) return
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m))
    const supabase = createClient()
    await supabase.from("group_messages").update({ content: newContent }).eq("id", id).eq("sender_id", userId)
  }, [])

  const leaveGroup = React.useCallback(async () => {
    const userId = userIdRef.current
    if (!userId) return
    const supabase = createClient()
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId)
  }, [groupId])

  return { group, members, messages, send, addReaction, deleteMessage, editMessage, leaveGroup, loading, currentUserId, currentUserRole, reload: load }
}
