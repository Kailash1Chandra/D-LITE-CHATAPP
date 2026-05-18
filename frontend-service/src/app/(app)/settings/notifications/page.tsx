"use client";

import React, { useState, useEffect } from "react";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingRow } from "@/features/settings/components/SettingRow";

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

export default function NotificationsSettingsPage() {
  const [dms, setDms] = usePersisted("notif_dms", true);
  const [mentions, setMentions] = usePersisted("notif_mentions", true);
  const [calls, setCalls] = usePersisted("notif_calls", true);
  const [email, setEmail] = usePersisted("notif_email", false);

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <SettingsHeader title="Notifications" description="Choose what you want to be notified about." />

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold themed-text mb-4">Push Notifications</h3>

        <SettingRow
          label="Direct Messages"
          description="Receive a notification when someone sends you a direct message."
          checked={dms}
          onChange={setDms}
        />

        <SettingRow
          label="Mentions & Replies"
          description="Get notified when someone @mentions you or replies to your message in a group."
          checked={mentions}
          onChange={setMentions}
        />

        <SettingRow
          label="Incoming Calls"
          description="Ring when someone starts a video or audio call with you."
          checked={calls}
          onChange={setCalls}
        />

        <h3 className="font-bold themed-text mb-4 mt-8 pt-4 border-t border-[var(--border-soft)]">Email Notifications</h3>
        <SettingRow
          label="Daily Summary"
          description="Receive a daily email summarizing unread activity."
          checked={email}
          onChange={setEmail}
        />
      </div>
    </div>
  );
}
