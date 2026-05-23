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
}

interface UseGroupMessagesReturn {
  group: GroupPreview | null
  members: (User & { role: "owner" | "admin" | "mod" | "member" })[]
  messages: GroupMessage[]
  send: (content: string, mediaUrl?: string) => void
  deleteMessage: (id: string) => void
  editMessage: (id: string, newContent: string) => void
  loading: boolean
  currentUserId: string | null
  currentUserRole: "owner" | "admin" | "mod" | "member" | null
  reload: () => void
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

    const [groupRes, msgRes] = await Promise.all([
      supabase
        .from("groups")
        .select(`id, name, members:group_members(role, profile:profiles(id, display_name, username, status))`)
        .eq("id", groupId)
        .single(),
      supabase
        .from("group_messages")
        .select(`id, content, media_url, created_at, sender_id, sender:profiles(id, display_name, username)`)
        .eq("group_id", groupId)
        .order("created_at", { ascending: true }),
    ])

    if (groupRes.data) {
      const g = groupRes.data as any
      const rawMembers = (g.members || []).map((m: any): User & { role: "owner" | "admin" | "mod" | "member" } => {
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
      setMessages(
        msgRes.data.map((m: any) => {
          const sender = m.sender as any
          const name: string = sender?.display_name || sender?.username || "Unknown"
          return {
            id: m.id,
            direction: m.sender_id === user.id ? "out" : "in",
            authorName: m.sender_id === user.id ? "You" : name,
            role: "member",
            content: m.content || "",
            mediaUrl: m.media_url ?? undefined,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  const deleteMessage = React.useCallback(async (id: string) => {
    const userId = userIdRef.current
    if (!userId) return
    setMessages((prev) => prev.filter((m) => m.id !== id))
    const supabase = createClient()
    await supabase.from("group_messages").delete().eq("id", id).eq("sender_id", userId)
  }, [])

  const editMessage = React.useCallback(async (id: string, newContent: string) => {
    const userId = userIdRef.current
    if (!userId) return
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: newContent } : m))
    const supabase = createClient()
    await supabase.from("group_messages").update({ content: newContent }).eq("id", id).eq("sender_id", userId)
  }, [])

  return { group, members, messages, send, deleteMessage, editMessage, loading, currentUserId, currentUserRole, reload: load }
}
