"use client";

import React from "react";
import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";

interface CallControlsProps {
  muted: boolean;
  camOff: boolean;
  isVideo: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onShareScreen: () => void;
  onLeave: () => void;
}

function ControlBtn({
  active, danger, onClick, title, children,
}: {
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      title={title}
      className="flex flex-col items-center gap-1.5"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
        style={{
          background: danger
            ? "#ef4444"
            : active
            ? "rgba(255,255,255,0.15)"
            : "rgba(255,255,255,0.08)",
          boxShadow: danger ? "0 4px 20px rgba(239,68,68,0.4)" : undefined,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <span style={{ color: danger ? "#fff" : active ? "#fbbf24" : "rgba(255,255,255,0.85)" }}>
          {children}
        </span>
      </div>
      <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
        {title}
      </span>
    </motion.button>
  );
}

export function CallControls({
  muted, camOff, isVideo,
  onToggleMic, onToggleCam, onShareScreen, onLeave,
}: CallControlsProps) {
  return (
    <div
      className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-center gap-5 pb-8 pt-4"
      style={{
        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
      }}
    >
      <ControlBtn active={muted} onClick={onToggleMic} title={muted ? "Unmute" : "Mute"}>
        {muted ? <MicOff size={22} /> : <Mic size={22} />}
      </ControlBtn>

      {isVideo && (
        <ControlBtn active={camOff} onClick={onToggleCam} title={camOff ? "Start Video" : "Stop Video"}>
          {camOff ? <VideoOff size={22} /> : <Video size={22} />}
        </ControlBtn>
      )}

      {isVideo && (
        <ControlBtn onClick={onShareScreen} title="Share Screen">
          <ScreenShare size={22} />
        </ControlBtn>
      )}

      {/* Leave button — bigger, red */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={onLeave}
        title="Leave Call"
        className="flex flex-col items-center gap-1.5"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "#ef4444", boxShadow: "0 6px 24px rgba(239,68,68,0.5)" }}
        >
          <PhoneOff size={24} className="text-white" />
        </div>
        <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
          Leave
        </span>
      </motion.button>
    </div>
  );
}
