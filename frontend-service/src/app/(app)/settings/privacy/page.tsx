"use client";

import React, { useState } from "react";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingRow } from "@/features/settings/components/SettingRow";
import { DeviceSession } from "@/features/settings/components/DeviceSession";

export default function PrivacySettingsPage() {
  const [readReceipts, setReadReceipts] = useState(true);
  const [typing, setTyping] = useState(true);
  const [online, setOnline] = useState(true);

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
          <DeviceSession 
            device="MacBook Pro (macOS)" 
            location="San Francisco, US" 
            time="Active now" 
            isCurrent={true} 
          />
          <DeviceSession 
            device="iPhone 14 Pro (iOS)" 
            location="San Francisco, US" 
            time="Last active 2 hours ago" 
            isMobile={true} 
          />
        </div>
      </div>
    </div>
  );
}
