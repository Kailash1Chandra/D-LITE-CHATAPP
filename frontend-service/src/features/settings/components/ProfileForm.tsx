"use client";

import { useState } from "react";
import { Avatar } from "@/shared/components/Avatar";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { CldUploadWidget } from "next-cloudinary";
import { createClient } from "@/core/auth/supabase-client";
import { getInitials } from "@/shared/utils/initials";

interface ProfileFormProps {
  initialName: string;
  initialUsername: string;
  initialEmail: string;
  initialBio: string;
  initialAvatarUrl?: string;
}

export function ProfileForm({
  initialName,
  initialUsername,
  initialEmail,
  initialBio,
  initialAvatarUrl,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      email: email !== initialEmail ? email : undefined,
      data: {
        full_name: name,
        username,
        bio,
        avatar_url: avatarUrl,
      },
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  const handleAvatarUpload = (result: { info?: unknown }) => {
    const info = result.info;
    if (info && typeof info === "object" && "secure_url" in info) {
      setAvatarUrl(info.secure_url as string);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex items-center gap-6 mb-8">
        <Avatar initials={getInitials(name)} size="lg" src={avatarUrl} className="w-24 h-24 text-2xl" />
        <div className="space-x-3 flex items-center">
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? "dlite_avatars" : "ml_default"}
            onSuccess={handleAvatarUpload}
          >
            {({ open }) => (
              <Button variant="primary" onClick={() => open()}>Upload Avatar</Button>
            )}
          </CldUploadWidget>
          <Button variant="secondary" className="text-danger border-red-100 hover:bg-red-50" onClick={() => setAvatarUrl(undefined)}>
            Remove
          </Button>
        </div>
      </div>

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
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-shadow resize-none h-24"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-success">Changes saved!</span>}
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
