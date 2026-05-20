"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Users, Phone, Sparkles, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { signOut } from "@/core/auth/actions";

interface IconRailProps {
  userInitials?: string;
  userAvatarUrl?: string;
}

const navItems = [
  { href: "/chat",    icon: MessageSquare, label: "Chats"        },
  { href: "/groups",  icon: Users,         label: "Groups"       },
  { href: "/calls",   icon: Phone,         label: "Calls"        },
  { href: "/ai",      icon: Sparkles,      label: "AI Assistant" },
];

export function IconRail({ userInitials = "DL", userAvatarUrl }: IconRailProps) {
  const pathname = usePathname();

  return (
    <nav
      className="w-[64px] h-screen flex flex-col items-center py-4 shrink-0"
      style={{
        background: "var(--rail-bg)",
        borderRight: "1px solid var(--rail-border)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-6 transition-transform hover:scale-105"
        style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
        title="Dashboard"
      >
        <LayoutDashboard size={18} className="text-white" />
      </Link>

      {/* Nav links */}
      <div className="flex flex-col items-center gap-1 flex-1 w-full px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group"
              style={{
                background: isActive ? "var(--grad-brand)" : "transparent",
                boxShadow: isActive ? "var(--shadow-glow)" : "none",
                color: isActive ? "#fff" : "var(--rail-text)",
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)";
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon size={19} />

              {/* Tooltip */}
              <span
                className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                style={{
                  background: "var(--surface-elevated, var(--surface))",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-elevated)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-1 w-full px-2">
        <ThemeToggle compact />

        <Link
          href="/settings"
          title="Settings"
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
          style={{
            color: pathname.startsWith("/settings") ? "var(--brand-text)" : "var(--rail-text)",
            background: pathname.startsWith("/settings") ? "var(--row-hover-bg)" : "transparent",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--row-hover-bg)"; }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = pathname.startsWith("/settings") ? "var(--row-hover-bg)" : "transparent";
          }}
        >
          <Settings size={19} />
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            title="Sign out"
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group"
            style={{ color: "var(--rail-text)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "var(--danger)";
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "var(--rail-text)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <LogOut size={19} />
          </button>
        </form>

        <div className="mt-1">
          <Link href="/settings" title="Profile">
            <Avatar
              initials={userInitials}
              src={userAvatarUrl}
              online
              size="sm"
              className="hover:scale-105 transition-transform cursor-pointer"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
}
