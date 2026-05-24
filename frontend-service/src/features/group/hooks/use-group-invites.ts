"use client"

import * as React from "react"
import { createClient } from "@/core/auth/supabase-client"

export interface GroupInvite {
  id: string
  groupId: string
  groupName: string
  invitedBy: string
  createdAt: string
}

export function useGroupInvites() {
  const [invites, setInvites] = React.useState<GroupInvite[]>([])
  const [loading, setLoading] = React.useState(true)
  const userIdRef = React.useRef<string | null>(null)

  const load = React.useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    userIdRef.current = user.id

    const { data: rawInvites } = await supabase
      .from("group_invites")
      .select("id, group_id, invited_by, created_at")
      .eq("invited_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (!rawInvites?.length) { setInvites([]); setLoading(false); return }

    const groupIds = [...new Set(rawInvites.map((i: any) => i.group_id))]
    const inviterIds = [...new Set(rawInvites.map((i: any) => i.invited_by))]

    const [groupsRes, invitersRes] = await Promise.all([
      supabase.from("groups").select("id, name").in("id", groupIds),
      supabase.from("profiles").select("id, display_name, username").in("id", inviterIds),
    ])

    const groupMap = new Map((groupsRes.data || []).map((g: any) => [g.id, g.name as string]))
    const inviterMap = new Map(
      (invitersRes.data || []).map((p: any) => [p.id, (p.display_name || p.username || "Someone") as string])
    )

    setInvites(rawInvites.map((inv: any) => ({
      id: inv.id,
      groupId: inv.group_id,
      groupName: groupMap.get(inv.group_id) ?? "Unknown Group",
      invitedBy: inviterMap.get(inv.invited_by) ?? "Someone",
      createdAt: inv.created_at,
    })))
    setLoading(false)
  }, [])

  const acceptInvite = React.useCallback(async (invite: GroupInvite) => {
    const userId = userIdRef.current
    if (!userId) return false
    const supabase = createClient()

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: invite.groupId, user_id: userId, role: "Member" })

    if (error) return false

    await supabase.from("group_invites").update({ status: "accepted" }).eq("id", invite.id)
    setInvites(prev => prev.filter(i => i.id !== invite.id))
    window.dispatchEvent(new CustomEvent("dlite:group-created", { detail: { groupId: invite.groupId } }))
    return true
  }, [])

  const declineInvite = React.useCallback(async (inviteId: string) => {
    const supabase = createClient()
    await supabase.from("group_invites").update({ status: "declined" }).eq("id", inviteId)
    setInvites(prev => prev.filter(i => i.id !== inviteId))
  }, [])

  React.useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel("my-group-invites")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_invites" }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  return { invites, loading, acceptInvite, declineInvite }
}
