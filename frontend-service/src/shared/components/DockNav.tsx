"use client";

import Link from "next/link";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  MessageSquare, Users, Phone, Sparkles, Zap,
  Settings, LogOut, Sun,
} from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { signOut } from "@/core/auth/actions";

interface DockNavProps {
  userInitials?: string;
  userAvatarUrl?: string;
}

const navItems = [
  { href: "/dashboard", icon: Zap,           label: "Dashboard"    },
  { href: "/chat",      icon: MessageSquare, label: "Chats"        },
  { href: "/groups",    icon: Users,         label: "Groups"       },
  { href: "/calls",     icon: Phone,         label: "Calls"        },
  { href: "/ai",        icon: Sparkles,      label: "AI Assistant" },
];

// Single dock item with macOS-style distance-based magnification
function DockItem({
  mouseX,
  href,
  icon: Icon,
  label,
  isActive,
}: {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return Infinity;
    const center = bounds.left + bounds.width / 2;
    return Math.abs(val - center);
  });

  const rawScale = useTransform(distance, [0, 55, 110], [1.65, 1.3, 1]);
  const scale = useSpring(rawScale, { stiffness: 380, damping: 22 });
  const rawY = useTransform(scale, [1, 1.65], [0, -14]);
  const y = useSpring(rawY, { stiffness: 380, damping: 22 });

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ scale, y }}
        className="relative flex flex-col items-center"
        title={label}
      >
        <motion.div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: isActive ? "var(--grad-brand)" : "rgba(255,255,255,0.07)",
            boxShadow: isActive ? "var(--shadow-glow)" : "none",
            color: isActive ? "#fff" : "var(--rail-text)",
            border: isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Icon size={20} />
        </motion.div>

        {/* Active dot */}
        {isActive && (
          <motion.div
            layoutId="dock-active-dot"
            className="absolute -bottom-2 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--brand-text)" }}
          />
        )}

        {/* Label on hover — shown via scale proxy through title only to keep dock clean */}
      </motion.div>
    </Link>
  );
}

function DockSeparator() {
  return (
    <div
      className="self-center mx-1"
      style={{ width: 1, height: 28, background: "var(--border)" }}
    />
  );
}

export function DockNav({ userInitials = "DL", userAvatarUrl }: DockNavProps) {
  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
      }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
        className="flex items-end gap-1 px-3 py-2.5 rounded-2xl"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
        onMouseMove={e => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {/* Main nav items */}
        {navItems.map(item => (
          <DockItem
            key={item.href}
            mouseX={mouseX}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname.startsWith(item.href)}
          />
        ))}

        <DockSeparator />

        {/* Theme toggle */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <ThemeToggle compact />
        </div>

        {/* Settings */}
        <Link href="/settings">
          <motion.div
            whileHover={{ scale: 1.2, y: -6 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: pathname.startsWith("/settings") ? "var(--row-hover-bg)" : "rgba(255,255,255,0.05)",
              color: pathname.startsWith("/settings") ? "var(--brand-text)" : "var(--rail-text)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            title="Settings"
          >
            <Settings size={19} />
          </motion.div>
        </Link>

        <DockSeparator />

        {/* Avatar / profile */}
        <Link href="/settings" title="Profile">
          <motion.div
            whileHover={{ scale: 1.2, y: -6 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <Avatar
              initials={userInitials}
              src={userAvatarUrl}
              online
              size="md"
              className="cursor-pointer"
            />
          </motion.div>
        </Link>

        {/* Sign out */}
        <form action={signOut}>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.2, y: -6 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "var(--rail-text)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            title="Sign out"
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "var(--danger)";
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.1)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "var(--rail-text)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
            }}
          >
            <LogOut size={19} />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
