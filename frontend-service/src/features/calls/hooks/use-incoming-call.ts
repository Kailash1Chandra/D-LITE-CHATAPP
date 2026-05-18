"use client"

import * as React from "react"
import { createClient } from "@/core/auth/supabase-client"

export interface IncomingCall {
  id: string
  type: "audio" | "video"
  caller: {
    id: string
    name: string
    initials: string
  }
}

function parseCaller(row: any): IncomingCall | null {
  const c = row.caller ?? row
  if (!c) return null
  const name: string = c.display_name || c.username || "Someone"
  return {
    id: row.id,
    type: row.type === "video" ? "video" : "audio",
    caller: {
      id: c.id,
      name,
      initials: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
    },
  }
}

export function useIncomingCall() {
  const [incomingCall, setIncomingCall] = React.useState<IncomingCall | null>(null)

  React.useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const userId = user.id   // captured in closure — no ref race condition

      // Check for a call that was already ringing before this page loaded
      const { data: existing } = await supabase
        .from("calls")
        .select("id, type, status, caller:profiles!calls_caller_id_fkey(id, display_name, username)")
        .eq("receiver_id", userId)
        .eq("status", "ringing")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing && !cancelled) {
        const parsed = parseCaller({ ...existing, caller: existing.caller })
        if (parsed) setIncomingCall(parsed)
      }

      // Subscribe AFTER userId is known — this was the root bug.
      // Previously the channel was set up synchronously before setup() resolved,
      // so userIdRef.current was null when INSERT events arrived and every event
      // was dropped by the receiver_id !== null check.
      channel = supabase
        .channel(`incoming-calls-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls" },
          async (payload) => {
            const row = payload.new as any
            if (row.receiver_id !== userId) return
            if (row.status !== "ringing") return

            const { data: profile } = await supabase
              .from("profiles")
              .select("id, display_name, username")
              .eq("id", row.caller_id)
              .single()

            if (profile && !cancelled) {
              const parsed = parseCaller({ ...row, caller: profile })
              if (parsed) setIncomingCall(parsed)
            }
          }
        )
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls" },
          (payload) => {
            const row = payload.new as any
            setIncomingCall((prev) => {
              if (prev && prev.id === row.id && row.status !== "ringing") return null
              return prev
            })
          }
        )
        .subscribe()
    }

    setup()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  async function accept(): Promise<IncomingCall | null> {
    if (!incomingCall) return null
    const supabase = createClient()
    await supabase.from("calls").update({ status: "ongoing" }).eq("id", incomingCall.id)
    const call = incomingCall
    setIncomingCall(null)
    return call
  }

  async function decline() {
    if (!incomingCall) return
    const supabase = createClient()
    await supabase.from("calls").update({ status: "rejected" }).eq("id", incomingCall.id)
    setIncomingCall(null)
  }

  return { incomingCall, accept, decline }
}
