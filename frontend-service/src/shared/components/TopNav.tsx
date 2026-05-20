"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageSquare, Users, Phone, Sparkles, LayoutDashboard,
  Settings, LogOut,
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

function NavItem({
  href, icon: Icon, label, isActive,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      className="flex items-center h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        layout
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center gap-2 rounded-xl my-auto overflow-hidden"
        style={{
          paddingTop: 7,
          paddingBottom: 7,
          paddingLeft: hovered ? 14 : 10,
          paddingRight: hovered ? 14 : 10,
          background: isActive
            ? "rgba(124,58,237,0.12)"
            : hovered
            ? "var(--row-hover-bg)"
            : "transparent",
          color: isActive
            ? "var(--brand-text)"
            : hovered
            ? "var(--text-primary)"
            : "var(--text-muted)",
        }}
      >
        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />

        {/* Expanding label */}
        <motion.span
          animate={{
            maxWidth: hovered ? 120 : 0,
            opacity: hovered ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[13px] font-semibold whitespace-nowrap overflow-hidden block"
        >
          {label}
        </motion.span>

        {/* Active bottom bar */}
        {isActive && (
          <motion.div
            layoutId="topnav-bar"
            className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full"
            style={{ background: "var(--grad-brand)" }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </motion.div>
    </Link>
  );
}

export function TopNav({ userInitials = "DL", userAvatarUrl }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header
      className="shrink-0 flex items-stretch"
      style={{
        height: 58,
        background: "var(--header-bg)",
        backdropFilter: "blur(28px) saturate(200%)",
        WebkitBackdropFilter: "blur(28px) saturate(200%)",
        borderBottom: "1px solid var(--border)",
        position: "relative",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-5 shrink-0 border-r"
        style={{ borderColor: "var(--border)" }}
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
        >
          <span className="text-white font-black text-[12px]">DL</span>
        </motion.div>
        <span className="font-black text-[15px] tracking-tight hidden sm:block" style={{ color: "var(--text-primary)" }}>
          D-LITE
        </span>
      </Link>

      {/* Nav items — icon-only default, expand on hover */}
      <nav className="flex items-stretch gap-1 flex-1 px-3">
        {navItems.map(item => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* Right section */}
      <div
        className="flex items-center gap-1 px-4 shrink-0 border-l"
        style={{ borderColor: "var(--border)" }}
      >
        <ThemeToggle compact />

        <Link href="/settings">
          <motion.div
            whileHover={{ scale: 1.12 }}
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

        <form action={signOut}>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.12 }}
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

        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

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
