"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, PhoneOff } from "lucide-react";
import { createClient } from "@/core/auth/supabase-client";

const ZEGO_APP_ID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID ?? 0);
const ZEGO_SECRET = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET ?? "";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function markCallDone(roomId: string) {
  if (!UUID_RE.test(roomId)) return;
  try {
    const supabase = createClient();
    await supabase
      .from("calls")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", roomId);
  } catch {}
}

function CallRoom() {
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  // The container div is ALWAYS in the DOM so ZEGOCLOUD can render into it.
  // We overlay loading/error states on top instead of hiding the container.
  const containerRef = useRef<HTMLDivElement>(null);
  const zpRef = useRef<any>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    async function init() {
      try {
        if (!ZEGO_APP_ID || !ZEGO_SECRET) {
          setErrorMsg(
            "ZEGOCLOUD credentials missing — set NEXT_PUBLIC_ZEGO_APP_ID and NEXT_PUBLIC_ZEGO_SERVER_SECRET."
          );
          setPhase("error");
          return;
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setErrorMsg("Not authenticated");
          setPhase("error");
          return;
        }

        const userId = user.id;
        const userName =
          user.user_metadata?.full_name ||
          user.user_metadata?.username ||
          "User";

        const { ZegoUIKitPrebuilt } = await import(
          "@zegocloud/zego-uikit-prebuilt"
        );

        if (cancelled) return;

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          ZEGO_APP_ID,
          ZEGO_SECRET,
          roomId,
          userId,
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        // Reveal the container — it already has full dimensions in the DOM
        setPhase("ready");

        // Wait one frame so the overlay disappears and the container is painted
        // before ZEGOCLOUD tries to measure it.
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (cancelled) return;

        const callType = searchParams.get("type");

        zp.joinRoom({
          container: containerRef.current,
          scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
          showScreenSharingButton: callType !== "audio",
          turnOnCameraWhenJoining: callType !== "audio",
          turnOnMicrophoneWhenJoining: true,
          onLeaveRoom: () => {
            markCallDone(roomId);
            router.back();
          },
        });
      } catch (e: any) {
        if (!cancelled) {
          setErrorMsg(e?.message ?? "Failed to start call");
          setPhase("error");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch {}
        zpRef.current = null;
      }
    };
  }, [roomId, router, searchParams]);

  return (
    <div className="relative h-screen w-full overflow-hidden themed-canvas">
      {/* ZEGOCLOUD renders into this — always in DOM, full size */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {phase === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
          style={{ background: "var(--canvas-solid, var(--canvas))" }}>
          <Loader2
            size={36}
            className="animate-spin"
            style={{ color: "var(--brand-text)" }}
          />
          <p className="text-sm themed-text-3">Connecting…</p>
        </div>
      )}

      {/* Error overlay */}
      {phase === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center px-8"
          style={{ background: "var(--canvas-solid, var(--canvas))" }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <PhoneOff size={28} style={{ color: "var(--danger)" }} />
          </div>
          <p className="font-bold themed-text">Could not start call</p>
          <p className="text-sm themed-text-3 max-w-sm">{errorMsg}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--grad-brand)" }}
          >
            Go back
          </button>
        </div>
      )}
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
