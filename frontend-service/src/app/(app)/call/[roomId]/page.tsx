"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, PhoneOff } from "lucide-react";
import { createClient } from "@/core/auth/supabase-client";

const CALLS_URL = process.env.NEXT_PUBLIC_CALLS_API_URL ?? "http://localhost:5060";

export default function CallPage() {
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!containerRef.current || !roomId) return;

    let zp: any = null;

    async function init() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setErrorMsg("Not authenticated"); setStatus("error"); return; }

        const userId = user.id;
        const userName = user.user_metadata?.full_name || user.user_metadata?.username || user.email || userId;

        // Fetch token from call-service (server-side, secure)
        const res = await fetch(
          `${CALLS_URL}/token?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setErrorMsg(err.error || `Call service error (${res.status})`);
          setStatus("error");
          return;
        }

        const { token, appId } = await res.json();

        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

        zp = ZegoUIKitPrebuilt.create(token);
        setStatus("ready");

        const callType = searchParams.get("type");
        const scenario = callType === "audio"
          ? ZegoUIKitPrebuilt.OneONoneCall
          : ZegoUIKitPrebuilt.OneONoneCall;

        zp.joinRoom({
          container: containerRef.current,
          scenario: { mode: scenario },
          showScreenSharingButton: true,
          turnOnCameraWhenJoining: callType !== "audio",
          turnOnMicrophoneWhenJoining: true,
          onLeaveRoom: () => router.push("/dashboard"),
        });
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Failed to start call");
        setStatus("error");
      }
    }

    init();

    return () => { if (zp) { try { zp.destroy(); } catch {} } };
  }, [roomId, router, searchParams]);

  return (
    <div className="flex h-screen w-full themed-canvas overflow-hidden items-center justify-center">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-text)" }} />
          <p className="text-sm themed-text-3">Connecting to call…</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
            <PhoneOff size={28} style={{ color: "var(--danger)" }} />
          </div>
          <p className="font-bold themed-text">Could not start call</p>
          <p className="text-sm themed-text-3">{errorMsg}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--grad-brand)" }}
          >
            Go back
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ display: status === "ready" ? "block" : "none" }}
      />
    </div>
  );
}
