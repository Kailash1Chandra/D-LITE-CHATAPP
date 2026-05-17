"use client";

import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingRow } from "@/features/settings/components/SettingRow";
import { ColorPicker } from "@/features/settings/components/ColorPicker";
import { useTheme } from "@/shared/theme/ThemeProvider";

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <SettingsHeader title="Appearance" description="Customize how D-Lite looks and feels on your device." />

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold themed-text mb-4">Theme</h3>

        <SettingRow
          label="Dark Mode"
          description="Switch to a dark color palette for low-light environments."
          checked={theme === "dark"}
          onChange={(checked) => setTheme(checked ? "dark" : "light")}
        />

        <SettingRow
          label="Brand Color"
          description="Select your primary accent color for buttons, toggles, and highlights."
          control={<ColorPicker />}
        />
      </div>
    </div>
  );
}
