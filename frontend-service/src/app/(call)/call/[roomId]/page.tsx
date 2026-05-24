"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PhoneOff, Phone, Loader2, Wifi, Video as VideoIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/core/auth/supabase-client";
import { Avatar } from "@/shared/components/Avatar";
import { CallControls } from "@/features/calls/components/CallControls";
import { useWebRTCCall } from "@/features/calls/hooks/use-webrtc-call";

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

function useCallTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

interface Peer { name: string; initials: string }

function CallRoom() {
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const callType = (searchParams.get("type") ?? "video") as "audio" | "video";
  const isVideo = callType === "video";

  // Callback refs: re-fire whenever either the element mounts OR the stream changes
  const [localVideoEl,  setLocalVideoEl]  = useState<HTMLVideoElement | null>(null);
  const [remoteVideoEl, setRemoteVideoEl] = useState<HTMLVideoElement | null>(null);
  const [peer, setPeer] = useState<Peer>({ name: "Connecting…", initials: "…" });

  const peerId = searchParams.get("peerId");
  const returnUrl = peerId ? `/chat/${peerId}` : "/dashboard";

  function leave() {
    markCallDone(roomId);
    window.location.href = returnUrl;
  }

  const [showingVideo, setShowingVideo] = useState(isVideo);
  const {
    phase, errorMsg,
    localStream, remoteStream,
    muted, camOff, isVideoActive,
    toggleMic, toggleCam, shareScreen, upgradeToVideo, hangUp,
  } = useWebRTCCall(roomId, callType, leave);

  // Sync video active state from hook
  useEffect(() => { setShowingVideo(isVideoActive); }, [isVideoActive]);

  const timerStr = useCallTimer(phase === "in-call");

  // Wire streams — runs when either the element mounts or the stream changes
  useEffect(() => {
    if (localVideoEl && localStream) { localVideoEl.srcObject = localStream; localVideoEl.play().catch(() => {}); }
  }, [localVideoEl, localStream]);

  useEffect(() => {
    if (remoteVideoEl && remoteStream) { remoteVideoEl.srcObject = remoteStream; remoteVideoEl.play().catch(() => {}); }
  }, [remoteVideoEl, remoteStream]);

  // Load peer info
  useEffect(() => {
    if (!UUID_RE.test(roomId)) return;
    const supabase = createClient();
    supabase
      .from("calls")
      .select("caller_id, receiver_id, caller:profiles!calls_caller_id_fkey(id,display_name,username), receiver:profiles!calls_receiver_id_fkey(id,display_name,username)")
      .eq("id", roomId)
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const raw: any = (data as any).caller_id === user.id ? (data as any).receiver : (data as any).caller;
        if (!raw) return;
        const name: string = raw.display_name || raw.username || "Unknown";
        setPeer({ name, initials: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() });
      });
  }, [roomId]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0f]">

      {/* ── Remote video — fullscreen background ── */}
      <video
        ref={setRemoteVideoEl}
        autoPlay playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: phase === "in-call" && showingVideo ? "block" : "none" }}
      />

      {/* ── Audio-only: show peer avatar when in-call ── */}
      {phase === "in-call" && !showingVideo && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{ background: "linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)" }}
        >
          <Avatar initials={peer.initials} size="xl" />
          <p className="text-xl font-bold text-white">{peer.name}</p>
          <p className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{timerStr}</p>
          {/* Upgrade to video button */}
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={async () => { await upgradeToVideo(); }}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
            <VideoIcon size={16} /> Turn on Camera
          </motion.button>
        </div>
      )}

      {/* ── Pre-call overlay (connecting / waiting) ── */}
      <AnimatePresence>
        {(phase === "connecting" || phase === "waiting") && (
          <motion.div
            key="pre"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-between py-16"
            style={{ background: "linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)" }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              {phase === "connecting"
                ? <><Loader2 size={12} className="animate-spin" /> Setting up…</>
                : <><Wifi size={12} className="animate-pulse" /> Waiting for {peer.name}…</>}
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                {[1.3, 1.65, 2.0].map((s, i) => (
                  <motion.div key={i} className="absolute inset-0 rounded-full"
                    style={{ background: "rgba(139,92,246,0.12)" }}
                    animate={{ scale: [1, s, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.7, ease: "easeInOut" }}
                  />
                ))}
                <div className="relative z-10"><Avatar initials={peer.initials} size="xl" /></div>
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-1">{peer.name}</h1>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {isVideo ? "Video Call" : "Audio Call"}
                </p>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={() => { hangUp(); }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#ef4444", boxShadow: "0 8px 32px rgba(239,68,68,0.45)" }}>
                <PhoneOff size={26} className="text-white" />
              </div>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Cancel</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Call ended overlay ── */}
      <AnimatePresence>
        {phase === "ended" && (
          <motion.div key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4"
            style={{ background: "rgba(0,0,0,0.85)" }}
          >
            <PhoneOff size={40} style={{ color: "#ef4444" }} />
            <p className="text-xl font-bold text-white">Call ended</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error screen ── */}
      <AnimatePresence>
        {phase === "error" && (
          <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 text-center px-8"
            style={{ background: "linear-gradient(160deg,#1a1a2e 0%,#16213e 100%)" }}
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.15)" }}>
              <PhoneOff size={36} style={{ color: "#ef4444" }} />
            </div>
            <p className="text-xl font-bold text-white">Call failed</p>
            <p className="text-sm max-w-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{errorMsg}</p>
            <motion.button whileHover={{ scale: 1.04 }} onClick={leave}
              className="px-8 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              Go back
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── In-call: header + local PIP + controls ── */}
      <AnimatePresence>
        {phase === "in-call" && (
          <motion.div key="incall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 pointer-events-none">

            {/* Top header */}
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-6 py-4 pointer-events-none"
              style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.6) 0%,transparent 100%)" }}>
              <div className="flex items-center gap-3">
                <Avatar initials={peer.initials} size="sm" />
                <div>
                  <p className="text-sm font-bold text-white">{peer.name}</p>
                  <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>{timerStr}</p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>
                {isVideo ? "Video" : "Audio"}
              </span>
            </div>

            {/* Local video — PIP bottom-right (always mounted so srcObject wires on mount) */}
            <div className="absolute bottom-32 right-4 pointer-events-auto"
              style={{
                width: 120, height: 160, borderRadius: 16, overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.75)",
                display: showingVideo ? "block" : "none",
              }}>
              <video ref={setLocalVideoEl} autoPlay playsInline muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>

            {/* Controls */}
            <div className="pointer-events-auto absolute bottom-0 inset-x-0">
              <CallControls
                muted={muted}
                camOff={camOff}
                isVideo={showingVideo}
                onToggleMic={toggleMic}
                onToggleCam={toggleCam}
                onShareScreen={shareScreen}
                onLeave={hangUp}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CallPage() {
  return <Suspense><CallRoom /></Suspense>;
}
