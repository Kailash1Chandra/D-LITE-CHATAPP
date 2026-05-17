"use client";

import Link from "next/link";
import { Phone, Video, PhoneMissed, PhoneCall } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/shared/components/Avatar";
import { Pill } from "@/shared/components/Pill";
import { IconButton } from "@/shared/components/IconButton";
import { CallPreview } from "../lib/mock-data";

function CallItem({ call }: { call: CallPreview }) {
  const isMissed = call.status === "missed";
  const CallIcon = isMissed ? PhoneMissed : (call.type === "video" ? Video : Phone);
  
  return (
    <motion.div 
      whileHover={{ x: 4 }}
      className="flex items-center gap-3 py-3 hover:bg-[var(--row-hover-bg)] rounded-lg px-2 -mx-2 transition-colors"
    >
      <div className="relative">
        <Avatar initials={call.user.initials} online={call.user.isOnline} size="sm" />
        <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border themed-border ${isMissed ? "bg-[var(--danger)] text-white" : "themed-surface-2 themed-text-3"}`}>
          <CallIcon size={10} />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold themed-text truncate">{call.user.name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs themed-text-3">{call.time}</span>
          {isMissed ? (
            <Pill variant="danger" className="text-[10px] px-1.5 py-0 h-4">Missed</Pill>
          ) : (
            <Pill variant="neutral" className="text-[10px] px-1.5 py-0 h-4">{call.duration}</Pill>
          )}
        </div>
      </div>

      <Link href={`/chat/${call.user.id}`}>
        <IconButton size="sm" variant="ghost" className="text-[var(--brand-500)] hover:text-[var(--brand-600)] hover:bg-[var(--row-hover-bg)]">
          <PhoneCall size={16} />
        </IconButton>
      </Link>
    </motion.div>
  );
}

export function RecentCallsCard({ calls }: { calls: CallPreview[] }) {
  return (
    <div className="themed-surface border themed-border rounded-2xl p-6 shadow-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent-pink/10 text-accent-pink">
            <Phone size={16} />
          </div>
          <h3 className="font-bold themed-text">Recent Calls</h3>
        </div>
        <Link href="/calls" className="text-xs font-semibold text-[var(--brand-500)] hover:text-[var(--brand-600)]">
          View all
        </Link>
      </div>

      <div className="flex flex-col flex-1 divide-y themed-border">
        {calls.length === 0 ? (
          <p className="text-sm themed-text-3 py-4">No calls yet.</p>
        ) : (
          calls.map((call) => <CallItem key={call.id} call={call} />)
        )}
      </div>
    </div>
  );
}
