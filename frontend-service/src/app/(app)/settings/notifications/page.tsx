"use client";

import React, { useState } from "react";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingRow } from "@/features/settings/components/SettingRow";

export default function NotificationsSettingsPage() {
  const [mentions, setMentions] = useState(true);
  const [dms, setDms] = useState(true);
  const [calls, setCalls] = useState(true);
  const [email, setEmail] = useState(false);

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
