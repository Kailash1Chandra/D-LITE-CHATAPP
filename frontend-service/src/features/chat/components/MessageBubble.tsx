"use client";

import { Check, CheckCheck } from "lucide-react";
import { ReplyQuote } from "./ReplyQuote";
import { ReactionPill } from "./ReactionPill";

export interface MessageBubbleProps {
  id: string;
  content: string;
  mediaUrl?: string;
  direction: "in" | "out";
  status?: "sending" | "sent" | "read";
  time: string;
  reactions?: { emoji: string; count: number; active?: boolean }[];
  replyTo?: { authorName: string; content: string };
  onReact?: (emoji: string) => void;
}

export function MessageBubble({
  content,
  mediaUrl,
  direction,
  status = "read",
  time,
  reactions = [],
  replyTo,
  onReact,
}: MessageBubbleProps) {
  const isOut = direction === "out";

  return (
    <div className={`flex w-full mb-4 ${isOut ? "justify-end" : "justify-start"} group relative`}>
      {/* Reaction picker on hover */}
      <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${isOut ? "right-full mr-2" : "left-full ml-2"}`}>
        {["🔥", "👍", "❤️"].map(emoji => (
          <button
            key={emoji}
            onClick={() => onReact?.(emoji)}
            className="w-8 h-8 flex items-center justify-center rounded-full themed-surface shadow-sm themed-border hover:scale-110 transition-transform text-sm"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className={`relative max-w-[70%] flex flex-col ${isOut ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl relative overflow-hidden ${
            isOut ? "themed-msg-out rounded-tr-sm" : "themed-msg-in rounded-tl-sm"
          } ${mediaUrl && !content ? "p-0" : "px-4 py-3"}`}
        >
          {replyTo && (
            <div className={mediaUrl && !content ? "px-4 pt-3" : ""}>
              <ReplyQuote authorName={replyTo.authorName} content={replyTo.content} isOutbound={isOut} />
            </div>
          )}

          {/* Image */}
          {mediaUrl && (
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={mediaUrl}
                alt="media"
                className="max-w-full max-h-64 object-cover rounded-2xl block"
                style={{ minWidth: 120 }}
              />
            </a>
          )}

          {/* Caption / text */}
          {content && (
            <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${mediaUrl ? "px-4 pt-2 pb-1" : ""}`}>
              {content}
            </div>
          )}

          <div className={`flex items-center justify-end gap-1 text-[11px] ${mediaUrl && !content ? "px-3 pb-2 pt-1" : "mt-1"} ${isOut ? "text-white/80" : "themed-text-3"}`}>
            <span>{time}</span>
            {isOut && (
              <span className="ml-0.5">
                {status === "sending" && <Check size={14} className="opacity-50" />}
                {status === "sent" && <Check size={14} />}
                {status === "read" && <CheckCheck size={14} className="text-[var(--brand-200)]" />}
              </span>
            )}
          </div>
        </div>

        {reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 z-10 ${isOut ? "-mr-2" : "-ml-2"}`}>
            {reactions.map((r, i) => (
              <ReactionPill
                key={i}
                emoji={r.emoji}
                count={r.count}
                active={r.active}
                onClick={() => onReact?.(r.emoji)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
