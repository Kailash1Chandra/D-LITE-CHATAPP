"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, Smile, Send, X, FileText, Loader2,
  Image, Film, BarChart2, Paperclip,
} from "lucide-react";
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

// ── Attachment menu options ───────────────────────────────────────────────────
const ATTACH_OPTIONS = [
  {
    key: "photo",
    label: "Photo / Video",
    icon: Image,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.15)",
    accept: "image/*,video/*",
  },
  {
    key: "document",
    label: "Document",
    icon: Paperclip,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.15)",
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip",
  },
  {
    key: "video",
    label: "Video",
    icon: Film,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    accept: "video/*",
  },
  {
    key: "poll",
    label: "Poll",
    icon: BarChart2,
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
    accept: "",
  },
] as const;

type AttachKey = (typeof ATTACH_OPTIONS)[number]["key"];

// ── Poll creator ──────────────────────────────────────────────────────────────
function PollCreator({ onSend, onClose }: { onSend: (text: string) => void; onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  function addOption() {
    if (options.length < 5) setOptions(o => [...o, ""]);
  }

  function setOption(i: number, val: string) {
    setOptions(o => o.map((v, idx) => idx === i ? val : v));
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions(o => o.filter((_, idx) => idx !== i));
  }

  function submit() {
    const q = question.trim();
    const opts = options.map(o => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) return;
    const text = `📊 *${q}*\n` + opts.map((o, i) => `${i + 1}. ${o}`).join("\n");
    onSend(text);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border themed-border p-4 flex flex-col gap-3"
      style={{ background: "var(--surface-2, var(--surface))" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} style={{ color: "#10b981" }} />
          <span className="text-sm font-semibold themed-text">Create Poll</span>
        </div>
        <button onClick={onClose} className="themed-text-3 hover:themed-text transition-colors">
          <X size={16} />
        </button>
      </div>

      <input
        autoFocus
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask a question…"
        className="w-full bg-transparent border themed-border rounded-xl px-3 py-2 text-sm themed-text outline-none focus:border-[var(--input-border-focus)] transition-colors"
      />

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs themed-text-3 w-4 text-center">{i + 1}</span>
            <input
              value={opt}
              onChange={e => setOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1 bg-transparent border themed-border rounded-xl px-3 py-2 text-sm themed-text outline-none focus:border-[var(--input-border-focus)] transition-colors"
            />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)} className="themed-text-3 hover:text-[var(--danger)]">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {options.length < 5 ? (
          <button
            onClick={addOption}
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: "var(--brand-text)" }}
          >
            <Plus size={13} /> Add option
          </button>
        ) : <span />}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={submit}
          disabled={!question.trim() || options.filter(Boolean).length < 2}
          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-40"
          style={{ background: "var(--grad-brand)" }}
        >
          Send Poll
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Main Composer ─────────────────────────────────────────────────────────────
export function Composer({ onSend, placeholder = "Type a message..." }: ComposerProps) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPoll, setShowPoll] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  useEffect(() => {
    return () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
    setShowMenu(false);
  }

  function removeFile() {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
  }

  function handleAttach(key: AttachKey) {
    setShowMenu(false);
    if (key === "poll") { setShowPoll(true); return; }
    if (key === "photo") { photoInputRef.current?.click(); return; }
    if (key === "document") { docInputRef.current?.click(); return; }
    if (key === "video") { videoInputRef.current?.click(); return; }
  }

  async function handleSend(rawText?: string) {
    const msg = rawText ?? text;
    if (!msg.trim() && !pendingFile) return;
    setUploadErr(false);
    try {
      setUploading(!!pendingFile);
      let cloudUrl: string | undefined;
      if (pendingFile) {
        if (!CLOUD_NAME) {
          setUploadErr(true);
          setUploading(false);
          return;
        }
        cloudUrl = await uploadToCloudinary(pendingFile);
      }
      onSend(msg.trim(), cloudUrl);
      setText("");
      removeFile();
    } catch {
      setUploadErr(true);
    } finally {
      setUploading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isImage = pendingFile?.type.startsWith("image/");
  const isVid   = pendingFile?.type.startsWith("video/");
  const isVideo = pendingFile?.type.startsWith("video/");
  const canSend = (text.trim().length > 0 || !!pendingFile) && !uploading;

  return (
    <div className="relative p-3 md:p-4 themed-surface border-t themed-border flex flex-col gap-2">
      {uploadErr && (
        <p className="text-xs px-1" style={{ color: "var(--danger)" }}>
          ⚠ Upload failed — check that NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set in Vercel and the "dlite_avatars" preset is Unsigned in Cloudinary console.
        </p>
      )}

      {/* Hidden file inputs */}
      <input ref={photoInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
      <input ref={docInputRef}   type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" className="hidden" onChange={handleFileChange} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />

      {/* Poll creator */}
      <AnimatePresence>
        {showPoll && (
          <PollCreator onSend={(t) => handleSend(t)} onClose={() => setShowPoll(false)} />
        )}
      </AnimatePresence>

      {/* File preview */}
      <AnimatePresence>
        {pendingFile && previewUrl && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-3 px-1"
          >
            <div className="relative shrink-0">
              {isImage ? (
                <img src={previewUrl} alt="preview" className="h-16 w-16 rounded-xl object-cover border themed-border" />
              ) : isVideo ? (
                <video src={previewUrl} className="h-16 w-16 rounded-xl object-cover border themed-border" muted />
              ) : (
                <div className="h-16 w-16 rounded-xl border themed-border flex flex-col items-center justify-center gap-1"
                  style={{ background: "var(--surface-2, var(--surface))" }}>
                  <FileText size={22} style={{ color: "var(--brand-text)" }} />
                  <span className="text-[9px] themed-text-3 px-1 text-center">
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
                {(pendingFile.size / 1024).toFixed(0)} KB · {isImage ? "Image" : isVideo ? "Video" : "File"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {/* + button + popup menu */}
        <div ref={menuRef} className="relative mb-1">
          <IconButton
            size="md" variant="ghost"
            className={`themed-text-3 hover:text-[var(--brand-text)] transition-transform ${showMenu ? "rotate-45" : ""}`}
            style={{ transition: "transform 0.2s" }}
            onClick={() => { setShowMenu(v => !v); setShowPoll(false); }}
          >
            <Plus size={22} />
          </IconButton>

          {/* Attachment popup */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-full left-0 mb-2 rounded-2xl overflow-hidden z-50"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  minWidth: 180,
                }}
              >
                {ATTACH_OPTIONS.map(({ key, label, icon: Icon, color, bg }) => (
                  <button
                    key={key}
                    onClick={() => handleAttach(key)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium themed-text hover:bg-[var(--row-hover-bg)] transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: bg }}>
                      <Icon size={16} style={{ color }} />
                    </span>
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text area */}
        <div className="flex-1 themed-surface-2 border themed-border rounded-2xl flex items-end overflow-hidden
          focus-within:border-[var(--input-border-focus)] focus-within:ring-2 focus-within:ring-[var(--brand-200)]/30 transition-all">
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

        {/* Send button */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => handleSend()}
          disabled={!canSend}
          className={`w-11 h-11 mb-1 rounded-full flex items-center justify-center transition-all ${
            canSend ? "brand-grad text-white send-btn-glow" : "themed-surface-2 themed-text-3 cursor-not-allowed"
          }`}
        >
          {uploading ? <Loader2 size={17} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
        </motion.button>
      </div>
    </div>
  );
}
