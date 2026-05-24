"use client";

import { Camera } from "lucide-react";
import dynamic from "next/dynamic";

const CldUploadWidget = dynamic(
  () => import("next-cloudinary").then((m) => m.CldUploadWidget),
  { ssr: false }
);

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface AvatarUploadProps {
  avatarUrl: string | null;
  initials: string;
  onUpload: (result: { info?: unknown }) => void;
}

export function AvatarUpload({ avatarUrl, initials, onUpload }: AvatarUploadProps) {
  const circle = (
    <div
      className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold border-2"
      style={{
        background: avatarUrl ? "transparent" : "var(--grad-brand)",
        borderColor: "var(--border-strong)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  if (!CLOUD_NAME) {
    return (
      <div className="flex flex-col items-center gap-2">
        {circle}
        <p className="text-xs themed-text-muted">Profile photo can be added later</p>
      </div>
    );
  }

  return (
    <CldUploadWidget uploadPreset="dlite_avatars" onSuccess={onUpload}>
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className="relative group cursor-pointer focus:outline-none"
        >
          {circle}

          <div
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.65)" }}
          >
            <Camera size={22} className="text-white" />
          </div>

          <div
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[var(--canvas-solid)]"
            style={{ background: "var(--grad-brand)" }}
          >
            <Camera size={12} className="text-white" />
          </div>
        </button>
      )}
    </CldUploadWidget>
  );
}
