"use client"

import * as React from "react"
import { createClient } from "@/core/auth/supabase-client"

const supabase = createClient()

interface UseBlockStatusReturn {
  isBlocked: boolean
  loading: boolean
  block: () => Promise<void>
  unblock: () => Promise<void>
}

export function useBlockStatus(peerId: string): UseBlockStatusReturn {
  const [isBlocked, setIsBlocked] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const userIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      userIdRef.current = user.id

      const { data } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", peerId)
        .maybeSingle()

      setIsBlocked(!!data)
      setLoading(false)
    }
    load()
  }, [peerId])

  const block = React.useCallback(async () => {
    const userId = userIdRef.current
    if (!userId) return
    await supabase.from("blocked_users").insert({ blocker_id: userId, blocked_id: peerId })
    setIsBlocked(true)
  }, [peerId])

  const unblock = React.useCallback(async () => {
    const userId = userIdRef.current
    if (!userId) return
    await supabase.from("blocked_users").delete().eq("blocker_id", userId).eq("blocked_id", peerId)
    setIsBlocked(false)
  }, [peerId])

  return { isBlocked, loading, block, unblock }
}
