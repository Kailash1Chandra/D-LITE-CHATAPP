"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { createClient } from "@/core/auth/supabase-client";

const STUN = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export type CallPhase = "connecting" | "waiting" | "in-call" | "ended" | "error";

export interface UseWebRTCCallReturn {
  phase: CallPhase;
  errorMsg: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  camOff: boolean;
  toggleMic: () => void;
  toggleCam: () => void;
  shareScreen: () => Promise<void>;
  hangUp: () => void;
}

export function useWebRTCCall(
  roomId: string,
  callType: "audio" | "video",
  onHangUp: () => void,
): UseWebRTCCallReturn {
  const [phase, setPhase] = useState<CallPhase>("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const makingOfferRef = useRef(false);
  const cancelledRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    cancelledRef.current = true;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    socketRef.current?.emit("leave_call_room", { roomId });
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, [roomId]);

  // ── Main setup ────────────────────────────────────────────────────────────

  useEffect(() => {
    let pc: RTCPeerConnection | null = null;

    async function setup() {
      try {
        // 1. Auth
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelledRef.current) return;

        // 2. Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        });
        if (cancelledRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);

        // 3. Create PeerConnection
        pc = new RTCPeerConnection(STUN);
        pcRef.current = pc;

        stream.getTracks().forEach(track => pc!.addTrack(track, stream));

        const remote = new MediaStream();
        setRemoteStream(remote);

        pc.ontrack = (e) => {
          e.streams[0].getTracks().forEach(t => remote.addTrack(t));
          setRemoteStream(new MediaStream(remote.getTracks()));
          setPhase("in-call");
        };

        // 4. Connect to realtime-service for signaling
        const wsUrl = (process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? "http://localhost:5050")
          .replace(/^wss?:\/\//, "https://").replace(/^http:\/\//, "http://");
        const socket = io(wsUrl, {
          auth: { user_id: user.id },
          // polling first → upgrades to websocket once Render wakes up.
          // websocket-only fails immediately when Render free tier is sleeping.
          transports: ["polling", "websocket"],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join_call_room", { roomId });
          setPhase("waiting");
        });

        // Peer joined → I was waiting → I send offer
        socket.on("peer_joined", async () => {
          if (!pc || makingOfferRef.current) return;
          try {
            makingOfferRef.current = true;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("call_signal", { roomId, signal: { type: "offer", sdp: pc.localDescription } });
          } finally {
            makingOfferRef.current = false;
          }
        });

        // Relay: offer / answer / ice
        socket.on("call_signal", async ({ signal }) => {
          if (!pc) return;
          try {
            if (signal.type === "offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit("call_signal", { roomId, signal: { type: "answer", sdp: pc.localDescription } });
            } else if (signal.type === "answer") {
              if (pc.signalingState !== "stable") {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              }
            } else if (signal.type === "candidate" && signal.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
            }
          } catch {}
        });

        socket.on("peer_left", () => {
          if (!cancelledRef.current) {
            setPhase("ended");
            setTimeout(onHangUp, 1500);
          }
        });

        // ICE → send to peer
        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            socket.emit("call_signal", { roomId, signal: { type: "candidate", candidate } });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc?.connectionState === "connected") setPhase("in-call");
          if (pc?.connectionState === "failed") {
            setErrorMsg("Connection failed. Check your network.");
            setPhase("error");
          }
        };

      } catch (e: any) {
        if (!cancelledRef.current) {
          setErrorMsg(e?.message ?? "Could not start call");
          setPhase("error");
        }
      }
    }

    setup();
    return cleanup;
  }, [roomId, callType, cleanup, onHangUp]);

  // ── Controls ──────────────────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !muted;
    stream.getAudioTracks().forEach(t => { t.enabled = enabled; });
    setMuted(!muted);
  }, [muted]);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !camOff;
    stream.getVideoTracks().forEach(t => { t.enabled = enabled; });
    setCamOff(!camOff);
  }, [camOff]);

  const shareScreen = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = screen.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(videoTrack);
      videoTrack.onended = () => {
        const original = localStreamRef.current?.getVideoTracks()[0];
        if (original && sender) sender.replaceTrack(original);
      };
    } catch {}
  }, []);

  const hangUp = useCallback(() => {
    cleanup();
    onHangUp();
  }, [cleanup, onHangUp]);

  return { phase, errorMsg, localStream, remoteStream, muted, camOff, toggleMic, toggleCam, shareScreen, hangUp };
}
