"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, PhoneOff } from "lucide-react";
import { createClient } from "@/core/auth/supabase-client";

const ZEGO_APP_ID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID ?? 0);
const ZEGO_SECRET = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET ?? "";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function updateCallStatus(roomId: string, status: string, endedAt?: boolean) {
  if (!UUID_RE.test(roomId)) return;
  const { createClient } = await import("@/core/auth/supabase-client");
  const supabase = createClient();
  const patch: Record<string, unknown> = { status };
  if (endedAt) patch.ended_at = new Date().toISOString();
  await supabase.from("calls").update(patch).eq("id", roomId);
}

function CallRoom() {
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
        if (!ZEGO_APP_ID || !ZEGO_SECRET) {
          setErrorMsg("Zego credentials not configured. Set NEXT_PUBLIC_ZEGO_APP_ID and NEXT_PUBLIC_ZEGO_SERVER_SECRET in Vercel.");
          setStatus("error");
          return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setErrorMsg("Not authenticated"); setStatus("error"); return; }

        const userId   = user.id;
        const userName = user.user_metadata?.full_name || user.user_metadata?.username || "User";

        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          ZEGO_APP_ID, ZEGO_SECRET, roomId, userId, userName
        );

        zp = ZegoUIKitPrebuilt.create(kitToken);
        setStatus("ready");

        const callType = searchParams.get("type");

        // Mark call as ongoing when joining
        await updateCallStatus(roomId, "ongoing");

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showScreenSharingButton: callType !== "audio",
          turnOnCameraWhenJoining: callType !== "audio",
          turnOnMicrophoneWhenJoining: true,
          onLeaveRoom: async () => {
            await updateCallStatus(roomId, "completed", true);
            router.back();
          },
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
          <p className="text-sm themed-text-3">Connecting…</p>
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
            <PhoneOff size={28} style={{ color: "var(--danger)" }} />
          </div>
          <p className="font-bold themed-text">Could not start call</p>
          <p className="text-sm themed-text-3">{errorMsg}</p>
          <button onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--grad-brand)" }}>
            Go back
          </button>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full"
        style={{ display: status === "ready" ? "block" : "none" }} />
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense>
      <CallRoom />
    </Suspense>
  );
}
