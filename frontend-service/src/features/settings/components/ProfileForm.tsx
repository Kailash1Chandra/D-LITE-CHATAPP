"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { createClient } from "@/core/auth/supabase-client";
import { getInitials } from "@/shared/utils/initials";

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "ml_default";

async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()).secure_url as string;
}

interface ProfileFormProps {
  initialName: string;
  initialUsername: string;
  initialEmail: string;
  initialBio: string;
  initialAvatarUrl?: string;
}

export function ProfileForm({ initialName, initialUsername, initialEmail, initialBio, initialAvatarUrl }: ProfileFormProps) {
  const [name, setName]         = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail]       = useState(initialEmail);
  const [bio, setBio]           = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialAvatarUrl);
  const [preview, setPreview]   = useState<string | undefined>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [loading, setLoading]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = getInitials(name || "U");

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr("");

    // Instant local preview
    const local = URL.createObjectURL(file);
    setPreview(local);

    if (!CLOUD_NAME) {
      setUploadErr("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not configured.");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      setPreview(url);
      URL.revokeObjectURL(local);
    } catch {
      setUploadErr("Upload failed. Check that NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is correct in Vercel.");
      setPreview(avatarUrl); // revert to old
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({
      email: email !== initialEmail ? email : undefined,
      data: { full_name: name, username, bio, avatar_url: avatarUrl },
    });
    if (err) setError(err.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setLoading(false);
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm mb-8">

      {/* ── Avatar upload ── */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative group">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          {/* Avatar circle */}
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white cursor-pointer select-none relative"
            style={{ background: preview ? undefined : "var(--grad-brand)" }}
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.45)" }}>
              {uploading
                ? <Loader2 size={24} className="text-white animate-spin" />
                : <Camera size={24} className="text-white" />}
            </div>
          </div>

          {/* Upload progress ring */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ border: "3px solid var(--brand-text)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }}
              />
            )}
          </AnimatePresence>
        </div>

        <div>
          <p className="text-sm font-semibold themed-text mb-1">Profile Photo</p>
          <p className="text-xs themed-text-3 mb-3">Click the avatar to upload a new photo</p>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border themed-border themed-text-2 hover:bg-[var(--row-hover-bg)] transition-colors disabled:opacity-50">
              <Camera size={13} /> Change Photo
            </button>
            {avatarUrl && (
              <button onClick={() => { setAvatarUrl(undefined); setPreview(undefined); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          {uploadErr && <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>{uploadErr}</p>}
        </div>
      </div>

      {/* ── Fields ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold themed-text-2 mb-1.5">Full Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold themed-text-2 mb-1.5">Username</label>
          <Input value={username} onChange={e => setUsername(e.target.value)} prefix="@" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold themed-text-2 mb-1.5">Email Address</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold themed-text-2 mb-1.5">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--input-border-focus)] transition-shadow resize-none h-24 themed-text"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-8 pt-6 border-t themed-border flex items-center justify-end gap-3">
        {saved && <span className="text-sm flex items-center gap-1" style={{ color: "var(--success)" }}><Check size={14} /> Saved!</span>}
        <Button variant="primary" onClick={handleSave} disabled={loading || uploading}>
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
