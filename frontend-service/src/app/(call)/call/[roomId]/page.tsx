"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PhoneOff, Phone, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/core/auth/supabase-client";
import { Avatar } from "@/shared/components/Avatar";

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

function useCallTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return { formatted, start: () => setRunning(true) };
}

interface Peer {
  name: string;
  initials: string;
  avatarUrl?: string;
}

function CallRoom() {
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const zpRef = useRef<any>(null);
  const timer = useCallTimer();

  const [phase, setPhase] = useState<"connecting" | "ringing" | "in-call" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [peer, setPeer] = useState<Peer>({ name: "Calling…", initials: "…" });
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const callType = searchParams.get("type") ?? "video";
  const isVideo = callType !== "audio";

  // Load peer info from the calls table
  useEffect(() => {
    if (!UUID_RE.test(roomId)) return;
    const supabase = createClient();
    supabase
      .from("calls")
      .select("caller_id, receiver_id, caller:profiles!calls_caller_id_fkey(id,display_name,username,avatar_url), receiver:profiles!calls_receiver_id_fkey(id,display_name,username,avatar_url)")
      .eq("id", roomId)
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const peerRaw = (data as any).caller_id === user.id
          ? (data as any).receiver
          : (data as any).caller;
        if (!peerRaw) return;
        const name: string = peerRaw.display_name || peerRaw.username || "Unknown";
        setPeer({
          name,
          initials: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
          avatarUrl: peerRaw.avatar_url ?? undefined,
        });
      });
  }, [roomId]);

  // Init ZEGOCLOUD
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    async function init() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setErrorMsg("Not authenticated"); setPhase("error"); return; }

        const userId = user.id;
        const userName = user.user_metadata?.full_name || user.user_metadata?.username || "User";

        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        if (cancelled) return;

        const appId = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID ?? 0);
        const secret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET ?? "";
        if (!appId || !secret) {
          setErrorMsg("ZEGOCLOUD credentials not configured — set NEXT_PUBLIC_ZEGO_APP_ID and NEXT_PUBLIC_ZEGO_SERVER_SECRET in Vercel.");
          setPhase("error");
          return;
        }

        // Use ZEGOCLOUD's own function — guaranteed correct token format.
        // Server-side token generation (call-service) was producing an AES
        // format that differed from what create() validates, causing kitToken error.
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appId, secret, roomId, userId, userName,
        );

        if (cancelled) return;

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        setPhase("ringing");
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (cancelled) return;

        zp.joinRoom({
          container: containerRef.current,
          scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
          showPreJoinView: false,
          showScreenSharingButton: isVideo,
          turnOnCameraWhenJoining: isVideo,
          turnOnMicrophoneWhenJoining: true,
          onJoinRoom: () => {
            if (!cancelled) { setPhase("in-call"); timer.start(); }
          },
          onLeaveRoom: () => {
            markCallDone(roomId);
            // Hard navigate to flush ZEGOCLOUD's WebSocket/WebAssembly from memory.
            // router.back() is a soft nav — ZEGO module stays loaded and keeps
            // trying to reconnect, causing "setting_online_undefined" noise on
            // subsequent pages.
            window.location.href = document.referrer || "/dashboard";
          },
        });
      } catch (e: any) {
        if (!cancelled) { setErrorMsg(e?.message ?? "Failed to start call"); setPhase("error"); }
      }
    }

    init();
    return () => {
      cancelled = true;
      if (zpRef.current) { try { zpRef.current.destroy(); } catch {} zpRef.current = null; }
    };
  }, [roomId, router, isVideo]);

  function leave() {
    markCallDone(roomId);
    if (zpRef.current) { try { zpRef.current.destroy(); } catch {} zpRef.current = null; }
    window.location.href = document.referrer || "/dashboard";
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0d0d14]">
      {/* ZEGOCLOUD video — always in DOM, revealed when in-call */}
      <div
        ref={containerRef}
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: phase === "in-call" ? 1 : 0, pointerEvents: phase === "in-call" ? "auto" : "none" }}
      />

      {/* ── Pre-call / connecting overlay ─────────────────────── */}
      <AnimatePresence>
        {(phase === "connecting" || phase === "ringing") && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-between py-16 px-6"
            style={{
              background: "linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
            }}
          >
            {/* Top — call type label */}
            <div className="flex flex-col items-center gap-2 mt-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                {phase === "connecting" ? "Connecting…" : isVideo ? "Video Call" : "Audio Call"}
              </span>
            </div>

            {/* Middle — peer avatar + name */}
            <div className="flex flex-col items-center gap-6">
              {/* Pulsing ring */}
              <div className="relative">
                {[1, 1.4, 1.8].map((scale, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full"
                    style={{ background: "rgba(139,92,246,0.15)" }}
                    animate={{ scale: [1, scale, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.6, ease: "easeInOut" }}
                  />
                ))}
                <div className="relative z-10">
                  <Avatar initials={peer.initials} size="xl" />
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-1">{peer.name}</h1>
                <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                  {phase === "connecting"
                    ? <><Loader2 size={13} className="animate-spin" /> Connecting…</>
                    : <><Phone size={13} className="animate-pulse" /> Calling…</>
                  }
                </div>
              </div>
            </div>

            {/* Bottom — only Cancel */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={leave}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
                style={{ background: "#ef4444", boxShadow: "0 8px 32px rgba(239,68,68,0.45)" }}
              >
                <PhoneOff size={26} className="text-white" />
              </div>
              <span className="text-white/60 text-xs font-medium">Cancel</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── In-call header (above ZEGOCLOUD video) ─────────────── */}
      <AnimatePresence>
        {phase === "in-call" && (
          <motion.div
            key="header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-6 py-4"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar initials={peer.initials} size="sm" />
              <div>
                <p className="text-sm font-bold text-white">{peer.name}</p>
                <p className="text-xs text-white/60">{timer.formatted}</p>
              </div>
            </div>
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}
            >
              {isVideo ? "Video" : "Audio"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error screen ────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 text-center px-8"
            style={{ background: "linear-gradient(160deg,#1a1a2e 0%,#16213e 100%)" }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.15)" }}
            >
              <PhoneOff size={36} style={{ color: "#ef4444" }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white mb-2">Call failed</p>
              <p className="text-sm text-white/50 max-w-sm">{errorMsg}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              onClick={() => router.back()}
              className="px-8 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
            >
              Go back
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
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
