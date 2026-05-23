"use client";

import { useState, useRef, useEffect } from "react";
import { AIHistorySidebar } from "@/features/ai/components/AIHistorySidebar";
import { AIHeader } from "@/features/ai/components/AIHeader";
import { AIMessage } from "@/features/ai/components/AIMessage";
import { SuggestionChip } from "@/features/ai/components/SuggestionChip";
import { AIComposer } from "@/features/ai/components/AIComposer";
import { ShimmerText } from "@/features/ai/components/ShimmerText";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { Sparkles, AlertCircle } from "lucide-react";

const AI_URL = process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:5070";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  isThinking?: boolean;
  isStreaming?: boolean;
  error?: boolean;
}

const SUGGESTIONS = [
  { emoji: "📊", label: "Summarize my active groups" },
  { emoji: "✍️", label: "Help me draft a professional message" },
  { emoji: "💡", label: "What can you help me with?" },
];

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerVal, setComposerVal] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // history sent to backend for context (role/content pairs)
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  function clearChat() {
    setMessages([]);
    setComposerVal("");
    setBusy(false);
    historyRef.current = [];
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (busy || !text.trim()) return;
    setBusy(true);

    const userMsgId = crypto.randomUUID();
    const aiMsgId = crypto.randomUUID();

    // 1. Add user message
    setMessages(prev => [...prev, { id: userMsgId, type: "user", content: text }]);

    // 2. Add AI placeholder (thinking)
    setMessages(prev => [...prev, { id: aiMsgId, type: "ai", content: "", isThinking: true }]);

    // Keep history for context
    historyRef.current.push({ role: "user", content: text });

    try {
      const res = await fetch(`${AI_URL}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyRef.current.slice(0, -1), // exclude the just-added user msg
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      // Switch from thinking → streaming
      setMessages(prev =>
        prev.map(m => m.id === aiMsgId ? { ...m, isThinking: false, isStreaming: true } : m)
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines only
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (data.error) throw new Error(data.error);
            
            // Skip status messages
            if (data.status) continue;
            
            if (data.done) {
              // Exit both loops
              buffer = "";
              throw new Error("DONE_STREAMING");
            }
            if (data.delta) {
              accumulated += data.delta;
              setMessages(prev =>
                prev.map(m => m.id === aiMsgId ? { ...m, content: accumulated, isStreaming: true } : m)
              );
            }
          } catch (e) {
            if (e instanceof Error && e.message === "DONE_STREAMING") throw e;
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      // Handle DONE_STREAMING as normal completion
      if (err instanceof Error && err.message === "DONE_STREAMING") {
        // Normal completion
        setMessages(prev =>
          prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m)
        );
        historyRef.current.push({ role: "assistant", content: accumulated });
        setBusy(false);
        return;
      }

      const msg = err instanceof Error ? err.message : "Something went wrong";
      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId
            ? { ...m, isThinking: false, isStreaming: false, content: msg, error: true }
            : m
        )
      );
      // Remove failed user message from history
      historyRef.current.pop();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-canvas">
      <AIHistorySidebar onNew={clearChat} />

      <div className="flex-1 flex flex-col h-full relative z-0">
        <AIHeader onClear={clearChat} />

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth scrollbar-thin flex flex-col items-center">
          <div className="w-full max-w-4xl">

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[50vh]">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg"
                  style={{ background: "var(--grad-brand)" }}
                >
                  <Sparkles size={32} />
                </div>
                <h2 className="text-2xl font-bold themed-text mb-2">
                  How can I help you today?
                </h2>
                <p className="themed-text-3 text-sm mb-8">
                  Ask anything about your chats
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {SUGGESTIONS.map((s) => (
                    <SuggestionChip
                      key={s.label}
                      emoji={s.emoji}
                      label={s.label}
                      onClick={() => setComposerVal(s.label)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((m) => {
              if (m.type === "user") {
                return (
                  <MessageBubble
                    key={m.id}
                    id={m.id}
                    direction="out"
                    content={m.content}
                    time="Just now"
                    status="read"
                  />
                );
              }

              // Thinking
              if (m.isThinking) {
                return (
                  <div key={m.id} className="flex gap-4 w-full mb-6">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 mt-1"
                      style={{ background: "var(--grad-brand)" }}
                    >
                      <Sparkles size={14} />
                    </div>
                    <div className="flex items-center text-sm pt-2">
                      <ShimmerText text="thinking..." className="lowercase" />
                    </div>
                  </div>
                );
              }

              // Error state
              if (m.error) {
                return (
                  <div key={m.id} className="flex gap-4 w-full mb-6">
                    <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center text-danger shrink-0 mt-1">
                      <AlertCircle size={14} />
                    </div>
                    <div className="flex-1">
                      <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-danger border border-danger/20 bg-danger/5">
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              }

              // AI response (streaming or complete)
              return (
                <AIMessage key={m.id}>
                  <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                  {m.isStreaming && (
                    <span
                      className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                      style={{ background: "var(--brand-500)" }}
                    />
                  )}
                </AIMessage>
              );
            })}

            <div ref={bottomRef} />
          </div>
        </div>

        <AIComposer
          value={composerVal}
          onChange={setComposerVal}
          onSend={handleSend}
          disabled={busy}
        />
      </div>
    </div>
  );
}
