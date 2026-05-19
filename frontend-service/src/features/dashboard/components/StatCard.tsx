"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  suffix?: string;
}

export function StatCard({ label, value, icon, gradient, suffix = "" }: StatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) { setCount(0); return; }
    let current = 0;
    const step = Math.max(1, Math.ceil(value / 25));
    const timer = setInterval(() => {
      current = Math.min(current + step, value);
      setCount(current);
      if (current >= value) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="absolute inset-0 opacity-[0.06] rounded-2xl" style={{ background: gradient }} />
      <div className="relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white"
          style={{ background: gradient }}
        >
          {icon}
        </div>
        <p className="text-3xl font-black mb-0.5" style={{ color: "var(--text-primary)" }}>
          {count.toLocaleString()}{suffix}
        </p>
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
}
