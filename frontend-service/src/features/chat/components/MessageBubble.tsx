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

export function MessageBubble({
  id, content, mediaUrl, direction, status = "read",
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

  // Close menu on outside click
  useEffect(() => {
    if (!menu && !showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menu, showEmoji]);

  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

  // Right-click on bubble
  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setShowEmoji(false);
    setMenu(clampMenu(e.clientX, e.clientY));
  }

  // ⋯ button click — anchor menu to the button
  const openMenuFromBtn = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowEmoji(false);
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu(clampMenu(isOut ? rect.left : rect.right - MENU_W, rect.top));
  }, [isOut]);

  function closeAll() { setMenu(null); setShowEmoji(false); }

  function copy() {
    navigator.clipboard.writeText(content);
    closeAll();
  }

  function startEdit() {
    setEditText(content);
    setEditing(true);
    closeAll();
  }

  function saveEdit() {
    if (editText.trim() && editText.trim() !== content) onEdit?.(id, editText.trim());
    setEditing(false);
  }

  function handleDelete() {
    onDelete?.(id);
    closeAll();
  }

  const actions = [
    { icon: Copy,   label: "Copy",               action: copy,         show: !!content,               danger: false },
    { icon: Pencil, label: "Edit",               action: startEdit,    show: isOut && !!content,      danger: false },
    { icon: Trash2, label: "Delete for everyone", action: handleDelete, show: isOut,                   danger: true  },
  ].filter(a => a.show);

  return (
    <div
      className={`flex w-full mb-1 ${isOut ? "justify-end" : "justify-start"} group`}
      onContextMenu={handleContextMenu}
    >
      {/* Hover controls — 😊 and ⋯ */}
      <div
        className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-end mb-1
          ${isOut ? "order-first mr-1" : "order-last ml-1"}`}
      >
        {onReact && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowEmoji(v => !v); setMenu(null); }}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            title="React"
          >
            <Smile size={14} />
          </button>
        )}
        <button
          onClick={openMenuFromBtn}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          title="More"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      <div className={`relative max-w-[68%] flex flex-col ${isOut ? "items-end" : "items-start"}`}>

        {/* Emoji quick picker — floats above bubble */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.12 }}
              className={`absolute -top-11 z-30 flex gap-1 ${isOut ? "right-0" : "left-0"}`}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 99,
                padding: "4px 8px",
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact?.(emoji); setShowEmoji(false); }}
                  className="text-lg hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-full"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bubble */}
        <div
          className={`rounded-2xl relative ${
            isOut ? "themed-msg-out rounded-br-sm" : "themed-msg-in rounded-bl-sm"
          } ${editing ? "w-64" : ""} ${mediaUrl && !content ? "p-0 overflow-hidden" : "px-4 py-2.5"}`}
        >
          {replyTo && (
            <div className={mediaUrl && !content ? "px-4 pt-3" : "mb-2"}>
              <ReplyQuote authorName={replyTo.authorName} content={replyTo.content} isOutbound={isOut} />
            </div>
          )}

          {mediaUrl && (
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
              <img src={mediaUrl} alt="media" className="max-w-full max-h-64 object-cover block" style={{ minWidth: 120 }} />
            </a>
          )}

          {editing ? (
            <div className="flex flex-col gap-2 p-1">
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
                <button onClick={() => setEditing(false)} className="text-[11px] opacity-70 hover:opacity-100 px-2">Cancel</button>
                <button onClick={saveEdit} className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>Save</button>
              </div>
            </div>
          ) : (
            content && (
              <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${mediaUrl ? "px-4 pt-2 pb-1" : ""}`}>
                {content}
              </div>
            )
          )}

          {/* Time + tick */}
          {!editing && (
            <div className={`flex items-center gap-1 text-[11px] mt-0.5
              ${mediaUrl && !content ? "px-3 pb-2 pt-1" : ""}
              ${isOut ? "text-white/60 justify-end" : "themed-text-3 justify-end"}`}
            >
              <span>{time}</span>
              {isOut && (
                <span className="flex items-center">
                  {status === "sending"   && <Check size={13} className="opacity-40" />}
                  {status === "sent"      && <Check size={13} />}
                  {status === "delivered" && <CheckCheck size={13} className="opacity-80" />}
                  {status === "read"      && <CheckCheck size={13} style={{ color: "#38bdf8" }} />}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Reaction pills */}
        {reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOut ? "-mr-1" : "-ml-1"}`}>
            {reactions.map((r, i) => (
              <ReactionPill key={i} emoji={r.emoji} count={r.count} active={r.active} onClick={() => onReact?.(r.emoji)} />
            ))}
          </div>
        )}
      </div>

      {/* Context / ⋯ menu — viewport-clamped fixed position */}
      <AnimatePresence>
        {menu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.92, y: menu.above ? -6 : 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="fixed z-[60] rounded-2xl overflow-hidden"
            style={{
              top: menu.above ? menu.y : menu.y,
              left: menu.x,
              transform: menu.above ? "translateY(-100%)" : "translateY(8px)",
              width: MENU_W,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {/* Quick emoji row */}
            <div className="flex gap-0.5 px-2.5 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact?.(emoji); closeAll(); }}
                  className="text-xl hover:scale-125 transition-transform flex-1 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--row-hover-bg)]"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Action list */}
            <div className="py-1">
              {actions.map(({ icon: Icon, label, action, danger }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--row-hover-bg)]"
                  style={{ color: danger ? "var(--danger)" : "var(--text-primary)" }}
                >
                  <Icon size={15} style={{ color: danger ? "var(--danger)" : "var(--text-muted)" }} />
                  {label}
                </button>
              ))}
              {actions.length === 0 && (
                <p className="px-4 py-2.5 text-sm themed-text-3">No actions available</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
