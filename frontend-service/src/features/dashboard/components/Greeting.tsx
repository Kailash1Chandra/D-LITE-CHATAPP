"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Sparkles } from "lucide-react";

export function Greeting({ name = "there" }: { name?: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const sub = hour < 12 ? "Let's see what today holds." : hour < 17 ? "Here's your activity." : "Here's how your day went.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl mb-6 p-8"
      style={{
        background: "linear-gradient(135deg, var(--brand-600,#7c3aed) 0%, var(--brand-400,#a855f7) 50%, var(--accent-pink,#ec4899) 100%)",
      }}
    >
      {/* Background blobs */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.3)", filter: "blur(40px)" }} />
      <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.5)", filter: "blur(30px)" }} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-white/70 text-sm font-medium mb-1 uppercase tracking-widest">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-4xl font-black text-white mb-1">
            {greeting}, <span className="text-white/90">{name}</span>
          </h1>
          <p className="text-white/60 text-sm">{sub}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/chat">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <MessageCircle size={15} /> New Chat
            </motion.button>
          </Link>
          <Link href="/calls">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <Phone size={15} /> Calls
            </motion.button>
          </Link>
          <Link href="/ai">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.95)", color: "#7c3aed", backdropFilter: "blur(8px)" }}
            >
              <Sparkles size={15} /> AI Chat
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
