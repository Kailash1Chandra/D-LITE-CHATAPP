"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageSquare, Users, Phone, Sparkles, Zap, Settings, LogOut,
} from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { signOut } from "@/core/auth/actions";

interface TopNavProps {
  userInitials?: string;
  userAvatarUrl?: string;
}

const navItems = [
  { href: "/dashboard", icon: Zap,           label: "Dashboard" },
  { href: "/chat",      icon: MessageSquare, label: "Chats"     },
  { href: "/groups",    icon: Users,         label: "Groups"    },
  { href: "/calls",     icon: Phone,         label: "Calls"     },
  { href: "/ai",        icon: Sparkles,      label: "AI"        },
];

export function TopNav({ userInitials = "DL", userAvatarUrl }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header
      className="shrink-0 flex items-center px-5 gap-2"
      style={{
        height: 56,
        background: "var(--header-bg)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        position: "relative",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 mr-5 shrink-0">
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
        >
          <span className="text-white font-black text-[11px] tracking-tight">DL</span>
        </div>
        <span className="font-black text-[15px] tracking-tight" style={{ color: "var(--text-primary)" }}>
          D-LITE
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-colors select-none"
                style={{
                  background: isActive ? "var(--grad-brand)" : "transparent",
                  color: isActive ? "#fff" : "var(--rail-text)",
                  boxShadow: isActive ? "var(--shadow-glow)" : "none",
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
                <Icon size={14} />
                {label}

                {/* Active underline for non-gradient style alternative */}
                {isActive && (
                  <motion.div
                    layoutId="topnav-indicator"
                    className="absolute -bottom-[13px] left-2 right-2 h-[2px] rounded-full"
                    style={{ background: "var(--brand-text)" }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Right — theme + settings + avatar + signout */}
      <div className="flex items-center gap-1.5 shrink-0">
        <ThemeToggle compact />

        <Link href="/settings">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "var(--rail-text)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)";
              (e.currentTarget as HTMLElement).style.color = "var(--brand-text)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--rail-text)";
            }}
            title="Settings"
          >
            <Settings size={16} />
          </motion.div>
        </Link>

        <form action={signOut}>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.1 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: "var(--rail-text)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.1)";
              (e.currentTarget as HTMLElement).style.color = "var(--danger)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--rail-text)";
            }}
            title="Sign out"
          >
            <LogOut size={15} />
          </motion.button>
        </form>

        <Link href="/settings">
          <Avatar
            initials={userInitials}
            src={userAvatarUrl}
            online
            size="sm"
            className="cursor-pointer hover:scale-105 transition-transform ml-1"
          />
        </Link>
      </div>
    </header>
  );
}
