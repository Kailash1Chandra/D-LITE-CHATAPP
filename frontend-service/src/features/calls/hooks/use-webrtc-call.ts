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
  // Store onHangUp in a ref so it never causes the effect to restart
  const onHangUpRef = useRef(onHangUp);
  useEffect(() => { onHangUpRef.current = onHangUp; }, [onHangUp]);

  // ── Main setup — only re-runs when roomId or callType changes ────────────

  useEffect(() => {
    let cancelled = false; // local flag per effect run (not a ref)

    function doCleanup() {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      if (socketRef.current) {
        socketRef.current.emit("leave_call_room", { roomId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

    async function setup() {
      try {
        // 1. Auth
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) { setErrorMsg("Not authenticated"); setPhase("error"); return; }

        // 2. Get local media
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === "video",
          });
        } catch {
          setErrorMsg("Camera/microphone access denied. Allow permissions and try again.");
          setPhase("error");
          return;
        }
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);

        // 3. PeerConnection
        const pc = new RTCPeerConnection(STUN);
        pcRef.current = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const remote = new MediaStream();
        setRemoteStream(remote);

        pc.ontrack = (e) => {
          e.streams[0]?.getTracks().forEach(t => remote.addTrack(t));
          setRemoteStream(new MediaStream(remote.getTracks()));
          setPhase("in-call");
        };

        pc.onicecandidate = ({ candidate }) => {
          if (candidate && socketRef.current) {
            socketRef.current.emit("call_signal", { roomId, signal: { type: "candidate", candidate } });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") setPhase("in-call");
          if (pc.connectionState === "failed") {
            setErrorMsg("Peer connection failed. Check your network.");
            setPhase("error");
          }
          if (pc.connectionState === "disconnected") {
            setPhase("ended");
            setTimeout(() => { if (!cancelled) onHangUpRef.current(); }, 1500);
          }
        };

        // 4. Socket.IO signaling
        const wsUrl = (process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? "http://localhost:5050")
          .replace(/^wss?:\/\//, "https://");
        const socket = io(wsUrl, {
          auth: { user_id: user.id },
          transports: ["polling", "websocket"],
          reconnection: true,
          reconnectionAttempts: 8,
          reconnectionDelay: 2000,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          if (!cancelled) {
            socket.emit("join_call_room", { roomId });
            setPhase("waiting");
          }
        });

        socket.on("connect_error", () => {
          if (!cancelled) {
            setErrorMsg("Could not reach signaling server. Make sure NEXT_PUBLIC_REALTIME_WS_URL is set.");
            setPhase("error");
          }
        });

        // Peer joined first → send offer
        socket.on("peer_joined", async () => {
          if (cancelled || !pcRef.current || makingOfferRef.current) return;
          try {
            makingOfferRef.current = true;
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            socket.emit("call_signal", { roomId, signal: { type: "offer", sdp: pcRef.current.localDescription } });
          } catch {} finally {
            makingOfferRef.current = false;
          }
        });

        // Receive signals
        socket.on("call_signal", async ({ signal }: { signal: any }) => {
          if (cancelled || !pcRef.current) return;
          try {
            if (signal.type === "offer") {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              const answer = await pcRef.current.createAnswer();
              await pcRef.current.setLocalDescription(answer);
              socket.emit("call_signal", { roomId, signal: { type: "answer", sdp: pcRef.current.localDescription } });
            } else if (signal.type === "answer") {
              if (pcRef.current.signalingState !== "stable") {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              }
            } else if (signal.type === "candidate" && signal.candidate) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
            }
          } catch {}
        });

        socket.on("peer_left", () => {
          if (!cancelled) {
            setPhase("ended");
            setTimeout(() => { if (!cancelled) onHangUpRef.current(); }, 1500);
          }
        });

      } catch (e: any) {
        if (!cancelled) {
          setErrorMsg(e?.message ?? "Could not start call");
          setPhase("error");
        }
      }
    }

    setup();
    return doCleanup;
  // Only restart when roomId or callType changes — onHangUp is in a ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, callType]);

  // ── Controls ─────────────────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nowMuted = !muted;
    stream.getAudioTracks().forEach(t => { t.enabled = !nowMuted; });
    setMuted(nowMuted);
  }, [muted]);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nowOff = !camOff;
    stream.getVideoTracks().forEach(t => { t.enabled = !nowOff; });
    setCamOff(nowOff);
  }, [camOff]);

  const shareScreen = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = screen.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(videoTrack);
        videoTrack.onended = () => {
          const original = localStreamRef.current?.getVideoTracks()[0];
          if (original && sender) sender.replaceTrack(original).catch(() => {});
        };
      }
    } catch {}
  }, []);

  const hangUp = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (socketRef.current) {
      socketRef.current.emit("leave_call_room", { roomId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    onHangUpRef.current();
  }, [roomId]);

  return { phase, errorMsg, localStream, remoteStream, muted, camOff, toggleMic, toggleCam, shareScreen, hangUp };
}
