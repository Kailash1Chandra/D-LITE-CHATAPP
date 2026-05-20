"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Phone, Sparkles, Settings, LogOut, Zap } from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { signOut } from "@/core/auth/actions";

interface IconRailProps {
  userInitials?: string;
  userAvatarUrl?: string;
}

const navItems = [
  { href: "/chat",      icon: MessageSquare, label: "Chats"        },
  { href: "/groups",    icon: Users,         label: "Groups"       },
  { href: "/calls",     icon: Phone,         label: "Calls"        },
  { href: "/ai",        icon: Sparkles,      label: "AI Assistant" },
  { href: "/dashboard", icon: Zap,           label: "Dashboard"    },
];

const COLLAPSED = 64;
const EXPANDED  = 210;

export function IconRail({ userInitials = "DL", userAvatarUrl }: IconRailProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      animate={{ width: open ? EXPANDED : COLLAPSED }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen flex flex-col py-4 shrink-0 overflow-hidden"
      style={{
        background: "var(--rail-bg)",
        borderRight: "1px solid var(--rail-border)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Logo / Brand */}
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-3 mb-6 shrink-0"
      >
        <motion.div
          whileHover={{ scale: 1.08 }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
        >
          <span className="text-white font-black text-[13px] tracking-tight">DL</span>
        </motion.div>

        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18, delay: 0.05 }}
              className="font-black text-base tracking-tight whitespace-nowrap overflow-hidden"
              style={{ color: "var(--text-primary)" }}
            >
              D-LITE
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 flex-1 px-2">
        {navItems.map(({ href, icon: Icon, label }, i) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 h-11 px-3 rounded-xl transition-colors relative overflow-hidden"
              style={{
                background: isActive ? "var(--grad-brand)" : "transparent",
                boxShadow: isActive ? "var(--shadow-glow)" : "none",
                color: isActive ? "#fff" : "var(--rail-text)",
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)";
                if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--rail-text)";
              }}
            >
              <Icon size={19} className="shrink-0" />

              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.16, delay: 0.04 + i * 0.03 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-0.5 px-2">
        {/* Theme toggle row */}
        <div className="flex items-center gap-3 h-10 px-3">
          <div className="shrink-0">
            <ThemeToggle compact />
          </div>
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, delay: 0.1 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
                style={{ color: "var(--rail-text)" }}
              >
                Theme
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className="flex items-center gap-3 h-11 px-3 rounded-xl transition-colors"
          style={{
            color: pathname.startsWith("/settings") ? "var(--brand-text)" : "var(--rail-text)",
            background: pathname.startsWith("/settings") ? "var(--row-hover-bg)" : "transparent",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)"; }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background =
              pathname.startsWith("/settings") ? "var(--row-hover-bg)" : "transparent";
          }}
        >
          <Settings size={19} className="shrink-0" />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, delay: 0.12 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 h-11 px-3 rounded-xl transition-colors"
            style={{ color: "var(--rail-text)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "var(--danger)";
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "var(--rail-text)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <LogOut size={19} className="shrink-0" />
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.16, delay: 0.14 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </form>

        {/* Avatar row */}
        <div className="flex items-center gap-3 px-3 mt-2">
          <Link href="/settings" title="Profile" className="shrink-0">
            <Avatar
              initials={userInitials}
              src={userAvatarUrl}
              online
              size="sm"
              className="hover:scale-105 transition-transform cursor-pointer"
            />
          </Link>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, delay: 0.16 }}
                className="min-w-0"
              >
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {userInitials}
                </p>
                <p className="text-[11px]" style={{ color: "var(--success)" }}>● Online</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}
