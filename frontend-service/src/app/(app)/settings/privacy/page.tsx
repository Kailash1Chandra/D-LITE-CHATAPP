"use client";

import React, { useState, useEffect } from "react";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingRow } from "@/features/settings/components/SettingRow";
import { DeviceSession } from "@/features/settings/components/DeviceSession";
import { createClient } from "@/core/auth/supabase-client";

function usePersisted(key: string, defaultValue: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) setValue(stored === "true");
  }, [key]);

  function set(v: boolean) {
    setValue(v);
    localStorage.setItem(key, String(v));
  }

  return [value, set];
}

interface Session {
  id: string;
  device: string;
  location: string;
  time: string;
  isCurrent: boolean;
  isMobile?: boolean;
}

export default function PrivacySettingsPage() {
  const [readReceipts, setReadReceipts] = usePersisted("privacy_readreceipts", true);
  const [typing, setTyping] = usePersisted("privacy_typing", true);
  const [online, setOnline] = usePersisted("privacy_online", true);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function loadSessions() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        setSessions([
          {
            id: data.session.access_token.slice(0, 8),
            device: "Current Browser",
            location: "Active session",
            time: "Active now",
            isCurrent: true,
          },
        ]);
      }
    }
    loadSessions();
  }, []);

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <SettingsHeader title="Privacy & Safety" description="Manage your visibility and active sessions." />

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="font-bold themed-text mb-4">Activity Status</h3>

        <SettingRow
          label="Show Online Status"
          description="Let others see when you are active on D-Lite."
          checked={online}
          onChange={setOnline}
        />
        <SettingRow
          label="Read Receipts"
          description="Show others when you have read their messages."
          checked={readReceipts}
          onChange={setReadReceipts}
        />
        <SettingRow
          label="Typing Indicators"
          description="Show others when you are typing a message."
          checked={typing}
          onChange={setTyping}
        />
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold themed-text mb-4">Active Sessions</h3>
        <div className="space-y-1">
          {sessions.map((s) => (
            <DeviceSession
              key={s.id}
              device={s.device}
              location={s.location}
              time={s.time}
              isCurrent={s.isCurrent}
              isMobile={s.isMobile}
            />
          ))}
          {sessions.length === 0 && (
            <p className="text-sm themed-text-3 py-2">No active sessions found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
