"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Check } from "lucide-react";
import dynamic from "next/dynamic";
import { createClient } from "@/core/auth/supabase-client";
import type { GroupPreview } from "@/features/dashboard/lib/mock-data";

const CldUploadWidget = dynamic(
  () => import("next-cloudinary").then((m) => m.CldUploadWidget),
  { ssr: false }
);

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const BG_PRESETS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#ff9a9e,#fad0c4)",
  "linear-gradient(135deg,#ffecd2,#fcb69f)",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

interface GroupEditModalProps {
  open: boolean;
  onClose: () => void;
  group: GroupPreview;
  onSaved: () => void;
}

export function GroupEditModal({ open, onClose, group, onSaved }: GroupEditModalProps) {
  const initials = group.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(group.avatarUrl ?? null);
  const [avatarBg, setAvatarBg] = useState<string>(group.avatarBg ?? BG_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("groups")
      .update({ avatar_url: avatarUrl, avatar_bg: avatarBg })
      .eq("id", group.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  const AvatarBox = ({ size }: { size: number }) => (
    <div
      className="rounded-2xl flex items-center justify-center text-white font-bold overflow-hidden shrink-0"
      style={{ width: size, height: size, background: avatarBg, fontSize: size * 0.3 }}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt="Group" className="w-[85%] h-[85%] rounded-xl object-cover" />
        : <span>{initials}</span>}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-sm rounded-2xl z-10 p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-elevated)" }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:opacity-80"
              style={{ background: "var(--row-hover-bg)", color: "var(--text-muted)" }}
            >
              <X size={15} />
            </button>

            <h2 className="text-base font-bold themed-text mb-4">Edit Group Appearance</h2>

            {/* Avatar preview + upload */}
            <div className="flex justify-center mb-1">
              {CLOUD_NAME ? (
                <CldUploadWidget
                  uploadPreset="dlite_avatars"
                  onSuccess={(result) => {
                    const info = result.info;
                    if (info && typeof info === "object" && "secure_url" in info) {
                      setAvatarUrl(info.secure_url as string);
                    }
                  }}
                >
                  {({ open: openWidget }) => (
                    <button
                      type="button"
                      onClick={() => openWidget()}
                      className="relative group cursor-pointer focus:outline-none"
                    >
                      <AvatarBox size={80} />
                      <div
                        className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.45)" }}
                      >
                        <Camera size={20} className="text-white" />
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[var(--surface)]"
                        style={{ background: "var(--grad-brand)" }}
                      >
                        <Camera size={11} className="text-white" />
                      </div>
                    </button>
                  )}
                </CldUploadWidget>
              ) : (
                <AvatarBox size={80} />
              )}
            </div>

            {avatarUrl && (
              <div className="flex justify-center mt-3 mb-1">
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="text-xs hover:underline"
                  style={{ color: "var(--danger)" }}
                >
                  Remove photo
                </button>
              </div>
            )}

            {/* Background frame */}
            <p className="text-[10px] font-bold uppercase tracking-wider mt-4 mb-2" style={{ color: "var(--text-muted)" }}>
              Background Frame
            </p>
            <div className="grid grid-cols-8 gap-1.5 mb-5">
              {BG_PRESETS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setAvatarBg(bg)}
                  className="w-8 h-8 rounded-xl relative transition-transform hover:scale-110"
                  style={{ background: bg }}
                >
                  {avatarBg === bg && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-xs mb-3 text-center" style={{ color: "var(--danger)" }}>{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold themed-text-2 transition-colors hover:bg-[var(--row-hover-bg)]"
                style={{ border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  : "Save Changes"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
