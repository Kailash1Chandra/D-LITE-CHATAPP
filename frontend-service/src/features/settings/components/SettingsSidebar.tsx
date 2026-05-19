"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Palette, Bell, Shield, KeyRound, HardDrive } from "lucide-react";

const links = [
  { href: "/settings",              icon: User,      label: "Profile",         exact: true },
  { href: "/settings/appearance",   icon: Palette,   label: "Appearance" },
  { href: "/settings/notifications",icon: Bell,      label: "Notifications" },
  { href: "/settings/privacy",      icon: Shield,    label: "Privacy & Safety" },
  { href: "/settings/2fa",          icon: KeyRound,  label: "Two-Factor Auth" },
  { href: "/settings/backup",       icon: HardDrive, label: "Backup & Export" },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div
      className="w-[240px] h-full flex flex-col shrink-0"
      style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="p-6">
        <h2 className="text-lg font-black mb-5" style={{ color: "var(--text-primary)" }}>
          Settings
        </h2>
        <nav className="space-y-0.5">
          {links.map(({ href, icon: Icon, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: isActive ? "var(--row-active-bg)" : "transparent",
                  color: isActive ? "var(--brand-text)" : "var(--text-secondary)",
                  borderLeft: isActive ? "3px solid var(--row-active-border)" : "3px solid transparent",
                }}
              >
                <Icon
                  size={17}
                  style={{ color: isActive ? "var(--brand-text)" : "var(--text-muted)" }}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
