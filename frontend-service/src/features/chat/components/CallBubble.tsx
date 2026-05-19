"use client";

import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from "lucide-react";

export interface CallBubbleProps {
  type: "audio" | "video";
  status: "completed" | "missed" | "rejected" | string;
  duration?: string;
  time: string;
  isOwn: boolean; // true = I made the call
}

export function CallBubble({ type, status, duration, time, isOwn }: CallBubbleProps) {
  const missed = status === "missed" || status === "rejected";
  const TypeIcon = type === "video" ? Video : Phone;
  const DirectionIcon = missed ? PhoneMissed : isOwn ? PhoneOutgoing : PhoneIncoming;

  const label = missed
    ? isOwn ? "No answer" : "Missed call"
    : type === "video" ? "Video call" : "Audio call";

  return (
    <div className={`flex w-full my-1 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm max-w-[240px]"
        style={{
          background: missed ? "rgba(239,68,68,0.08)" : "var(--surface-2, var(--surface))",
          border: `1px solid ${missed ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: missed ? "rgba(239,68,68,0.12)" : "rgba(var(--brand-rgb, 139,92,246),0.12)",
          }}
        >
          <DirectionIcon
            size={15}
            style={{ color: missed ? "var(--danger)" : "var(--brand-text)" }}
          />
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-semibold leading-tight"
            style={{ color: missed ? "var(--danger)" : "var(--text-primary)" }}
          >
            {label}
          </p>
          <p className="text-xs themed-text-3">
            {duration ? duration : time}
          </p>
        </div>
        <TypeIcon size={13} style={{ color: "var(--text-muted)", marginLeft: "auto" }} />
      </div>
    </div>
  );
}
