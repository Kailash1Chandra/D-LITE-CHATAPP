"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, CheckCheck, Copy, Pencil, Trash2, Smile, MoreHorizontal } from "lucide-react";
import { ReplyQuote } from "./ReplyQuote";
import { ReactionPill } from "./ReactionPill";
import { motion, AnimatePresence } from "framer-motion";

export interface MessageBubbleProps {
  id: string;
  content: string;
  mediaUrl?: string;
  direction: "in" | "out";
  status?: "sending" | "sent" | "delivered" | "read";
  time: string;
  reactions?: { emoji: string; count: number; active?: boolean }[];
  replyTo?: { authorName: string; content: string };
  onReact?: (emoji: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
}

const EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥"];
const MENU_W = 210;
const MENU_H = 230;

interface MenuPos { x: number; y: number; above: boolean }

function clampMenu(rawX: number, rawY: number): MenuPos {
  const above = rawY > MENU_H + 16;
  const x = Math.min(rawX, window.innerWidth - MENU_W - 8);
  return { x: Math.max(x, 8), y: rawY, above };
}

function TickIcon({ status }: { status: string }) {
  if (status === "sending")   return <Check size={12} style={{ opacity: 0.4, color: "currentColor" }} />;
  if (status === "sent")      return <Check size={12} style={{ opacity: 0.7, color: "currentColor" }} />;
  if (status === "delivered") return <CheckCheck size={12} style={{ opacity: 0.7, color: "currentColor" }} />;
  if (status === "read")      return <CheckCheck size={12} style={{ color: "#38bdf8" }} />;
  return null;
}

export function MessageBubble({
  id, content, mediaUrl, direction, status = "sent",
  time, reactions = [], replyTo,
  onReact, onDelete, onEdit,
}: MessageBubbleProps) {
  const isOut = direction === "out";
  const [menu, setMenu] = useState<MenuPos | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!menu && !showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null); setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menu, showEmoji]);

  useEffect(() => { if (editing) editRef.current?.focus(); }, [editing]);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setShowEmoji(false);
    setMenu(clampMenu(e.clientX, e.clientY));
  }

  const openMenuFromBtn = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowEmoji(false);
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu(clampMenu(isOut ? rect.left : rect.right - MENU_W, rect.top));
  }, [isOut]);

  function closeAll() { setMenu(null); setShowEmoji(false); }

  function copy() { navigator.clipboard.writeText(content); closeAll(); }
  function startEdit() { setEditText(content); setEditing(true); closeAll(); }
  function saveEdit() {
    if (editText.trim() && editText.trim() !== content) onEdit?.(id, editText.trim());
    setEditing(false);
  }
  function handleDelete() { onDelete?.(id); closeAll(); }

  const actions = [
    { icon: Copy,   label: "Copy",                action: copy,         show: !!content,          danger: false },
    { icon: Pencil, label: "Edit",                action: startEdit,    show: isOut && !!content, danger: false },
    { icon: Trash2, label: "Delete for everyone", action: handleDelete, show: isOut,              danger: true  },
  ].filter(a => a.show);

  const hasOnlyMedia = mediaUrl && !content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`flex w-full mb-1 ${isOut ? "justify-end" : "justify-start"} group`}
      onContextMenu={handleContextMenu}
    >
      {/* Hover action buttons */}
      <div
        className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 self-end mb-3
          ${isOut ? "order-first mr-2" : "order-last ml-2"}`}
      >
        {onReact && (
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); setShowEmoji(v => !v); setMenu(null); }}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <Smile size={13} />
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={openMenuFromBtn}
          className="w-7 h-7 flex items-center justify-center rounded-full"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <MoreHorizontal size={13} />
        </motion.button>
      </div>

      <div className={`relative max-w-[72%] flex flex-col ${isOut ? "items-end" : "items-start"}`}>

        {/* Emoji quick-picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 6 }}
              transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              className={`absolute -top-12 z-30 flex gap-0.5 px-2 py-1.5 ${isOut ? "right-0" : "left-0"}`}
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 99,
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact?.(emoji); setShowEmoji(false); }}
                  className="text-lg hover:scale-130 transition-transform w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BUBBLE ── */}
        <div
          className={`relative ${editing ? "w-72" : ""}`}
          style={
            isOut ? {
              /* Sent: gradient fill, no tail — iMessage Pro style */
              background: "var(--msg-out-bg)",
              boxShadow: "var(--msg-out-shadow)",
              color: "var(--msg-out-text)",
              borderRadius: hasOnlyMedia ? "18px" : "20px 20px 5px 20px",
              padding: hasOnlyMedia ? "0" : "10px 14px 8px",
              overflow: hasOnlyMedia ? "hidden" : undefined,
            } : {
              /* Received: frosted glass + left accent bar */
              background: "var(--msg-in-bg)",
              border: "1px solid var(--msg-in-border)",
              borderLeft: "3px solid var(--accent-purple)",
              backdropFilter: "blur(8px)",
              color: "var(--msg-in-text)",
              borderRadius: hasOnlyMedia ? "18px" : "20px 20px 20px 5px",
              padding: hasOnlyMedia ? "0" : "10px 14px 8px",
              overflow: hasOnlyMedia ? "hidden" : undefined,
            }
          }
        >
          {replyTo && (
            <div className="mb-2">
              <ReplyQuote authorName={replyTo.authorName} content={replyTo.content} isOutbound={isOut} />
            </div>
          )}

          {/* Media */}
          {mediaUrl && (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaUrl) ? (
            <video src={mediaUrl} controls className="max-w-full max-h-64 block" style={{ minWidth: 120, borderRadius: hasOnlyMedia ? "18px" : "12px", display: "block" }} />
          ) : (
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={mediaUrl} alt="media"
                className="max-w-full max-h-64 object-cover block"
                style={{ minWidth: 120, borderRadius: hasOnlyMedia ? "18px" : "10px" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </a>
          ))}

          {/* Text / Edit */}
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                  if (e.key === "Escape") setEditing(false);
                }}
                className="w-full bg-transparent outline-none resize-none text-[15px] leading-relaxed min-h-[40px]"
                style={{ color: isOut ? "#fff" : "var(--text-primary)" }}
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="text-[11px] opacity-60 hover:opacity-100 px-2">Cancel</button>
                <button onClick={saveEdit} className="text-[11px] font-bold px-3 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>Save</button>
              </div>
            </div>
          ) : content ? (
            <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${mediaUrl ? "px-4 pt-2 pb-1" : ""}`}>
              {content}
            </p>
          ) : null}

          {/* Time + tick — inside bubble, bottom right */}
          {!editing && (
            <div
              className={`flex items-center gap-1 mt-1 select-none ${
                hasOnlyMedia ? "absolute bottom-2 right-2 bg-black/40 rounded-full px-1.5 py-0.5" : ""
              }`}
              style={{ justifyContent: "flex-end" }}
            >
              <span
                className="text-[11px]"
                style={{ color: isOut ? "rgba(255,255,255,0.55)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}
              >
                {time}
              </span>
              {isOut && (
                <span style={{ color: "rgba(255,255,255,0.7)" }}>
                  <TickIcon status={status} />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOut ? "justify-end" : "justify-start"}`}>
            {reactions.map(r => (
              <ReactionPill
                key={r.emoji}
                emoji={r.emoji}
                count={r.count}
                active={r.active}
                onClick={() => onReact?.(r.emoji)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context menu portal */}
      <AnimatePresence>
        {(menu || showEmoji) && (menu) && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.92, y: menu.above ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 py-1 rounded-2xl overflow-hidden"
            style={{
              left: menu.x,
              [menu.above ? "bottom" : "top"]: menu.above ? window.innerHeight - menu.y + 4 : menu.y + 4,
              width: MENU_W,
              background: "var(--surface-elevated, var(--surface))",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            {/* Emoji row */}
            <div className="flex items-center justify-around px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact?.(emoji); closeAll(); }}
                  className="text-xl hover:scale-130 transition-transform w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/10"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Actions */}
            {actions.map(({ icon: Icon, label, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left"
                style={{ color: danger ? "var(--danger)" : "var(--text-primary)" }}
                onMouseEnter={e => (e.currentTarget.style.background = danger ? "rgba(239,68,68,0.08)" : "var(--row-hover-bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
