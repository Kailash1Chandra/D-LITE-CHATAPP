"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/shared/components/Avatar";
import type { IncomingCall } from "../hooks/use-incoming-call";

interface Props {
  call: IncomingCall | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallOverlay({ call, onAccept, onDecline }: Props) {
  return (
    <AnimatePresence>
      {call && (
        <>
          {/* Dim backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80]"
            style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)" }}
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed z-[90] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-3xl overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
            }}
          >
            {/* Gradient top band */}
            <div
              className="h-2 w-full"
              style={{ background: "var(--grad-brand)" }}
            />

            <div className="flex flex-col items-center px-8 pt-8 pb-10 gap-5">
              {/* Pulsing ring around avatar */}
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--grad-brand)", opacity: 0.25 }}
                  animate={{ scale: [1, 1.45, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--grad-brand)", opacity: 0.12 }}
                  animate={{ scale: [1, 1.75, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.3 }}
                />
                <div className="relative z-10">
                  <Avatar initials={call.caller.initials} size="xl" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest themed-text-3 mb-1">
                  Incoming {call.type === "video" ? "Video" : "Audio"} Call
                </p>
                <h2 className="text-2xl font-bold themed-text">{call.caller.name}</h2>
              </div>

              {/* Call type icon */}
              <div
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "var(--surface-2, var(--surface))",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                {call.type === "video" ? <Video size={13} /> : <Phone size={13} />}
                {call.type === "video" ? "Video Call" : "Audio Call"}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-8 mt-2">
                {/* Decline */}
                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDecline}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
                    style={{ background: "var(--danger)", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}
                  >
                    <PhoneOff size={26} className="text-white" />
                  </motion.button>
                  <span className="text-xs themed-text-3 font-medium">Decline</span>
                </div>

                {/* Accept */}
                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAccept}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
                    style={{ background: "var(--success)", boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}
                  >
                    <Phone size={26} className="text-white" />
                  </motion.button>
                  <span className="text-xs themed-text-3 font-medium">Accept</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
