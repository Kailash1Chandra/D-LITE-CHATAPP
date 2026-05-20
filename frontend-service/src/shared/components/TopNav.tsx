"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageSquare, Users, Phone, Sparkles, LayoutDashboard,
  Settings, LogOut, Search,
} from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { signOut } from "@/core/auth/actions";

interface TopNavProps {
  userInitials?: string;
  userAvatarUrl?: string;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/chat",      icon: MessageSquare,   label: "Chats"     },
  { href: "/groups",    icon: Users,           label: "Groups"    },
  { href: "/calls",     icon: Phone,           label: "Calls"     },
  { href: "/ai",        icon: Sparkles,        label: "AI"        },
];

export function TopNav({ userInitials = "DL", userAvatarUrl }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header
      className="shrink-0 flex items-stretch px-0 relative"
      style={{
        height: 58,
        background: "var(--header-bg)",
        backdropFilter: "blur(28px) saturate(200%)",
        WebkitBackdropFilter: "blur(28px) saturate(200%)",
        borderBottom: "1px solid var(--border)",
        zIndex: 50,
      }}
    >
      {/* ── Logo ── */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-5 shrink-0 border-r"
        style={{ borderColor: "var(--border)" }}
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
        >
          <span className="text-white font-black text-[12px]">DL</span>
        </motion.div>
        <span
          className="font-black text-[16px] tracking-tight hidden sm:block"
          style={{ color: "var(--text-primary)" }}
        >
          D-LITE
        </span>
      </Link>

      {/* ── Nav tabs ── */}
      <nav className="flex items-stretch gap-0 flex-1 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center gap-2 px-4 text-[13px] font-semibold select-none transition-colors"
              style={{ color: isActive ? "var(--brand-text)" : "var(--text-muted)" }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)";
              }}
            >
              <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden md:block">{label}</span>

              {/* Animated active underline */}
              {isActive && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t-full"
                  style={{ background: "var(--grad-brand)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Right section ── */}
      <div
        className="flex items-center gap-1.5 px-4 shrink-0 border-l"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Search shortcut */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] mr-2"
          style={{
            background: "var(--row-hover-bg)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <Search size={12} />
          <span>Search</span>
          <kbd
            className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={{ background: "var(--border)", color: "var(--text-muted)" }}
          >
            ⌘K
          </kbd>
        </motion.button>

        <ThemeToggle compact />

        {/* Settings icon */}
        <Link href="/settings">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)";
              (e.currentTarget as HTMLElement).style.color = "var(--brand-text)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
            title="Settings"
          >
            <Settings size={15} />
          </motion.div>
        </Link>

        {/* Sign out */}
        <form action={signOut}>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.1 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.1)";
              (e.currentTarget as HTMLElement).style.color = "var(--danger)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
            title="Sign out"
          >
            <LogOut size={14} />
          </motion.button>
        </form>

        {/* Divider */}
        <div className="w-px h-5 mx-0.5" style={{ background: "var(--border)" }} />

        {/* Avatar */}
        <Link href="/settings">
          <Avatar
            initials={userInitials}
            src={userAvatarUrl}
            online
            size="sm"
            className="cursor-pointer hover:scale-105 transition-transform"
          />
        </Link>
      </div>
    </header>
  );
}
