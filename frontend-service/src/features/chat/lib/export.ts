"use client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExportMessage {
  id: string;
  sender: "me" | "them";
  senderName: string;
  content: string;
  mediaUrl?: string;
  timestamp: string;       // ISO string
  reactions?: { emoji: string; count: number }[];
}

export interface ExportCall {
  id: string;
  type: "audio" | "video";
  status: string;
  startedAt: string;
  duration?: string;
  direction: "outgoing" | "incoming";
}

export interface ExportData {
  version: "1.0";
  app: "D-LITE";
  exportedAt: string;
  conversation: {
    peerId: string;
    peerName: string;
    myId: string;
    myName: string;
    dateRange: { from: string; to: string };
    messageCount: number;
    messages: ExportMessage[];
    calls: ExportCall[];
  };
}

// ── Format converters ─────────────────────────────────────────────────────────

export function toJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

export function toTXT(data: ExportData): string {
  const { conversation: c } = data;
  const lines: string[] = [
    `D-LITE Chat Export`,
    `Conversation: ${c.myName} ↔ ${c.peerName}`,
    `Exported: ${new Date(data.exportedAt).toLocaleString()}`,
    `Messages: ${c.messageCount}`,
    `═`.repeat(60),
    "",
  ];

  let lastDate = "";
  for (const msg of c.messages) {
    const d = new Date(msg.timestamp);
    const dateStr = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (dateStr !== lastDate) {
      lines.push("", `── ${dateStr} ──`, "");
      lastDate = dateStr;
    }
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const who = msg.sender === "me" ? c.myName : c.peerName;
    lines.push(`[${time}] ${who}: ${msg.content}`);
    if (msg.mediaUrl) lines.push(`  📎 ${msg.mediaUrl}`);
    if (msg.reactions?.length) {
      lines.push(`  ${msg.reactions.map(r => `${r.emoji} ${r.count}`).join("  ")}`);
    }
  }

  if (c.calls.length > 0) {
    lines.push("", `═`.repeat(60), "", `── Call History (${c.calls.length} calls) ──`, "");
    for (const call of c.calls) {
      const d = new Date(call.startedAt);
      lines.push(
        `${d.toLocaleString()} — ${call.direction} ${call.type} call` +
        (call.status === "missed" || call.status === "rejected" ? " [Missed]" : call.duration ? ` (${call.duration})` : "")
      );
    }
  }

  return lines.join("\n");
}

export function toHTML(data: ExportData): string {
  const { conversation: c } = data;

  function escHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  let msgHtml = "";
  let lastDate = "";
  for (const msg of c.messages) {
    const d = new Date(msg.timestamp);
    const dateStr = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (dateStr !== lastDate) {
      msgHtml += `<div class="date-sep"><span>${escHtml(dateStr)}</span></div>`;
      lastDate = dateStr;
    }
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const isMe = msg.sender === "me";
    const reactions = msg.reactions?.length
      ? `<div class="reactions">${msg.reactions.map(r => `<span class="pill">${r.emoji} ${r.count}</span>`).join("")}</div>`
      : "";
    const media = msg.mediaUrl ? `<a href="${escHtml(msg.mediaUrl)}" target="_blank"><img src="${escHtml(msg.mediaUrl)}" style="max-width:240px;border-radius:8px;margin-top:6px"></a>` : "";
    msgHtml += `
      <div class="msg ${isMe ? "out" : "in"}">
        <div class="bubble">
          ${msg.content ? `<p>${escHtml(msg.content).replace(/\n/g, "<br>")}</p>` : ""}
          ${media}
          <span class="time">${escHtml(time)}</span>
        </div>
        ${reactions}
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Chat with ${escHtml(c.peerName)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f0f18;color:#e2e8f0;min-height:100vh;padding:24px}
  header{text-align:center;margin-bottom:32px}
  header h1{font-size:22px;font-weight:700;color:#a78bfa}
  header p{font-size:13px;color:#64748b;margin-top:4px}
  .msgs{max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:2px}
  .date-sep{text-align:center;margin:20px 0;color:#475569;font-size:11px;position:relative}
  .date-sep::before,.date-sep::after{content:"";flex:1;border-top:1px solid #1e293b;display:inline-block;width:80px;vertical-align:middle;margin:0 12px}
  .msg{display:flex;flex-direction:column;margin:2px 0}
  .msg.out{align-items:flex-end}.msg.in{align-items:flex-start}
  .bubble{max-width:68%;padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.5}
  .msg.out .bubble{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border-bottom-right-radius:4px}
  .msg.in .bubble{background:#1e293b;color:#e2e8f0;border-bottom-left-radius:4px}
  .time{display:block;font-size:10px;margin-top:4px;opacity:.55;text-align:right}
  .reactions{display:flex;gap:4px;margin-top:3px}
  .pill{background:#1e293b;border:1px solid #334155;border-radius:99px;padding:2px 8px;font-size:12px}
</style></head>
<body>
<header>
  <h1>💬 ${escHtml(c.myName)} &amp; ${escHtml(c.peerName)}</h1>
  <p>Exported ${new Date(data.exportedAt).toLocaleString()} · ${c.messageCount} messages</p>
</header>
<div class="msgs">${msgHtml}</div>
</body></html>`;
}

// ── Download helper ───────────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── AES-GCM encryption (Web Crypto, PBKDF2 key derivation) ───────────────────

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: 250000, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptExport(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  const iv   = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const key  = await deriveKey(password, salt);
  const ct   = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, new TextEncoder().encode(data));
  const out  = new Uint8Array(16 + 12 + ct.byteLength);
  out.set(salt, 0);
  out.set(iv, 16);
  out.set(new Uint8Array(ct), 28);
  return "DLITE_ENC:" + btoa(String.fromCharCode(...Array.from(out)));
}

export async function decryptExport(enc: string, password: string): Promise<string> {
  if (!enc.startsWith("DLITE_ENC:")) throw new Error("Not an encrypted D-LITE export");
  const bytes = new Uint8Array(Array.from(atob(enc.slice(10)), c => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
  const salt  = bytes.slice(0, 16) as Uint8Array<ArrayBuffer>;
  const iv    = bytes.slice(16, 28) as Uint8Array<ArrayBuffer>;
  const ct    = bytes.slice(28);
  const key   = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, ct);
  return new TextDecoder().decode(plain);
}

export function isEncrypted(content: string): boolean {
  return content.startsWith("DLITE_ENC:");
}
