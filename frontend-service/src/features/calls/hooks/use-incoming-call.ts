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

export function useIncomingCall() {
  const [incomingCall, setIncomingCall] = React.useState<IncomingCall | null>(null)
  const userIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    const supabase = createClient()

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userIdRef.current = user.id

      // Pick up any call that was already ringing when the page loaded
      const { data } = await supabase
        .from("calls")
        .select(`id, type, status, caller:profiles!calls_caller_id_fkey(id, display_name, username)`)
        .eq("receiver_id", user.id)
        .eq("status", "ringing")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) parseAndSet(data)
    }

    function parseAndSet(row: any) {
      const c = row.caller
      if (!c) return
      const name: string = c.display_name || c.username || "Someone"
      setIncomingCall({
        id: row.id,
        type: row.type === "video" ? "video" : "audio",
        caller: {
          id: c.id,
          name,
          initials: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
        },
      })
    }

    setup()

    const channel = supabase
      .channel(`incoming-calls-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls" }, async (payload) => {
        const row = payload.new as any
        if (row.receiver_id !== userIdRef.current) return
        if (row.status !== "ringing") return

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name, username")
          .eq("id", row.caller_id)
          .single()

        if (profile) {
          parseAndSet({ ...row, caller: profile })
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls" }, (payload) => {
        const row = payload.new as any
        setIncomingCall((prev) => {
          if (prev && prev.id === row.id && row.status !== "ringing") return null
          return prev
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
