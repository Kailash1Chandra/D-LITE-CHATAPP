"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Smile, Send, X, ImageIcon, FileText, Loader2 } from "lucide-react";
import { IconButton } from "@/shared/components/IconButton";
import { motion, AnimatePresence } from "framer-motion";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = "dlite_avatars";

async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url as string;
}

export interface ComposerProps {
  onSend: (text: string, mediaUrl?: string) => void;
  placeholder?: string;
}

export function Composer({ onSend, placeholder = "Type a message..." }: ComposerProps) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function removeFile() {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
  }

  async function handleSend() {
    if (!text.trim() && !pendingFile) return;
    try {
      setUploading(!!pendingFile);
      let cloudUrl: string | undefined;
      if (pendingFile && CLOUD_NAME) {
        cloudUrl = await uploadToCloudinary(pendingFile);
      }
      onSend(text.trim(), cloudUrl);
      setText("");
      removeFile();
    } catch {
      // Upload failed — send text only
      onSend(text.trim());
      setText("");
      removeFile();
    } finally {
      setUploading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isImage = pendingFile?.type.startsWith("image/");
  const canSend = (text.trim().length > 0 || !!pendingFile) && !uploading;

  return (
    <div className="p-3 md:p-4 themed-surface border-t themed-border flex flex-col gap-2">

      {/* File preview — Telegram-style */}
      <AnimatePresence>
        {pendingFile && previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-3 px-1"
          >
            <div className="relative shrink-0">
              {isImage ? (
                <img src={previewUrl} alt="preview"
                  className="h-16 w-16 rounded-xl object-cover border themed-border" />
              ) : (
                <div className="h-16 w-16 rounded-xl border themed-border flex flex-col items-center justify-center gap-1"
                  style={{ background: "var(--surface-2, var(--surface))" }}>
                  <FileText size={22} style={{ color: "var(--brand-text)" }} />
                  <span className="text-[9px] themed-text-3 px-1 text-center truncate w-full">
                    {pendingFile.name.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button onClick={removeFile}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--danger)] text-white flex items-center justify-center shadow-md">
                <X size={10} strokeWidth={3} />
              </button>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium themed-text truncate">{pendingFile.name}</p>
              <p className="text-xs themed-text-3">
                {(pendingFile.size / 1024).toFixed(0)} KB · {isImage ? "Image" : "File"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {/* Hidden file input — no Cloudinary widget */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,application/pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <IconButton
          size="md"
          variant="ghost"
          className="themed-text-3 hover:text-[var(--brand-text)] mb-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus size={22} />
        </IconButton>

        {/* Text input */}
        <div className="flex-1 themed-surface-2 border themed-border rounded-2xl flex items-end overflow-hidden
          focus-within:border-[var(--input-border-focus)] focus-within:ring-2 focus-within:ring-[var(--brand-200)]/30
          transition-shadow transition-colors">
          <IconButton size="sm" variant="ghost" className="themed-text-3 hover:text-[var(--brand-text)] mb-1.5 ml-1">
            <Smile size={20} />
          </IconButton>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "Add a caption…" : placeholder}
            className="w-full bg-transparent py-3 px-2 outline-none resize-none min-h-[44px] max-h-[120px] text-[15px] themed-text custom-scrollbar"
            rows={1}
          />
        </div>

        {/* Send */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!canSend}
          className={`w-11 h-11 mb-1 rounded-full flex items-center justify-center transition-all ${
            canSend ? "brand-grad text-white send-btn-glow" : "themed-surface-2 themed-text-3 cursor-not-allowed"
          }`}
        >
          {uploading
            ? <Loader2 size={17} className="animate-spin" />
            : <Send size={18} className="ml-0.5" />
          }
        </motion.button>
      </div>
    </div>
  );
}
