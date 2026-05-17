"use client";

import React, { useRef, useEffect } from "react";
import { MessageBubble, MessageBubbleProps } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export interface ThreadMessage extends MessageBubbleProps {
  id: string;
  dateStr?: string;
}

export interface MessageThreadProps {
  messages: ThreadMessage[];
  typingUser?: { name: string; initials: string };
}

export function MessageThread({ messages, typingUser }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth custom-scrollbar">
      {messages.map((msg) => (
        <React.Fragment key={msg.id}>
          {msg.dateStr && (
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span
                className="text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{
                  background: "var(--surface-2, var(--surface))",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {msg.dateStr}
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
          )}
          <MessageBubble {...msg} />
        </React.Fragment>
      ))}

      {typingUser && (
        <TypingIndicator name={typingUser.name} initials={typingUser.initials} />
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
