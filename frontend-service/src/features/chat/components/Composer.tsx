"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Smile, Send, X } from "lucide-react";
import { IconButton } from "@/shared/components/IconButton";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const CldUploadWidget = dynamic(
  () => import("next-cloudinary").then((m) => m.CldUploadWidget),
  { ssr: false }
);

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export interface ComposerProps {
  onSend: (text: string, mediaUrl?: string) => void;
  placeholder?: string;
}

export function Composer({ onSend, placeholder = "Type a message..." }: ComposerProps) {
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() && !mediaUrl) return;
    onSend(text.trim(), mediaUrl ?? undefined);
    setText("");
    setMediaUrl(null);
    setMediaPreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 || !!mediaUrl;

  return (
    <div className="p-4 themed-surface border-t themed-border flex flex-col gap-2">

      {/* Image preview strip */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-1"
          >
            <div className="relative inline-block">
              <img
                src={mediaPreview}
                alt="attachment"
                className="h-20 w-20 rounded-xl object-cover border themed-border"
              />
              <button
                onClick={() => { setMediaUrl(null); setMediaPreview(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
              >
                <X size={11} strokeWidth={3} />
              </button>
            </div>
            <span className="text-xs themed-text-3">Image attached</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {/* Upload button */}
        {CLOUD_NAME ? (
          <CldUploadWidget
            uploadPreset="dlite_avatars"
            options={{ maxFiles: 1, resourceType: "image" }}
            onSuccess={(result: any) => {
              const info = result?.info;
              if (info && typeof info === "object" && "secure_url" in info) {
                setMediaUrl(info.secure_url as string);
                setMediaPreview(info.secure_url as string);
              }
            }}
          >
            {({ open }) => (
              <IconButton
                size="md"
                variant="ghost"
                className="themed-text-3 hover:text-[var(--brand-text)] mb-1"
                onClick={() => open()}
              >
                <Plus size={22} />
              </IconButton>
            )}
          </CldUploadWidget>
        ) : (
          <IconButton size="md" variant="ghost" className="themed-text-3 mb-1" disabled>
            <Plus size={22} />
          </IconButton>
        )}

        <div className="flex-1 themed-surface-2 border themed-border rounded-2xl flex items-end overflow-hidden focus-within:border-[var(--input-border-focus)] focus-within:ring-2 focus-within:ring-[var(--brand-200)]/30 transition-shadow transition-colors">
          <IconButton size="sm" variant="ghost" className="themed-text-3 hover:text-[var(--brand-text)] mb-1.5 ml-1">
            <Smile size={20} />
          </IconButton>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mediaUrl ? "Add a caption…" : placeholder}
            className="w-full bg-transparent py-3 px-2 outline-none resize-none min-h-[44px] max-h-[120px] text-[15px] themed-text custom-scrollbar"
            rows={1}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!canSend}
          className={`w-11 h-11 mb-1 rounded-full flex items-center justify-center transition-all ${
            canSend
              ? "brand-grad text-white send-btn-glow"
              : "themed-surface-2 themed-text-3 cursor-not-allowed"
          }`}
        >
          <Send size={18} className="ml-1" />
        </motion.button>
      </div>
    </div>
  );
}
