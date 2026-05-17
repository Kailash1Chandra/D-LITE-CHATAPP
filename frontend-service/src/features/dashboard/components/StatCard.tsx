"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: number;
  delta?: number;
  icon: React.ReactNode;
  iconColorClass?: string;
  suffix?: string;
}

export function StatCard({ label, value, delta = 0, icon, iconColorClass = "text-brand-500", suffix = "" }: StatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(value / 30));
    const timer = setInterval(() => {
      current = Math.min(current + step, value);
      setCount(current);
      if (current >= value) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  const isPositive = delta >= 0;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColorClass}`}
          style={{ background: "var(--surface-2, var(--surface))", border: "1px solid var(--border)" }}
        >
          {icon}
        </div>

        {delta !== 0 && (
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background: isPositive ? "var(--success-bg)" : "rgba(239,68,68,0.1)",
              color: isPositive ? "var(--success)" : "var(--danger)",
            }}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
          {count.toLocaleString()}{suffix}
        </p>
      </div>
    </motion.div>
  );
}
