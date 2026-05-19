"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Download, Upload, Shield, Clock, FileJson, FileText,
  Globe, Check, AlertCircle, Loader2, ChevronDown, Eye, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { createClient } from "@/core/auth/supabase-client";
import {
  toJSON, toTXT, toHTML, downloadFile,
  encryptExport, decryptExport, isEncrypted,
  ExportData, ExportMessage, ExportCall,
} from "@/features/chat/lib/export";

type Format = "json" | "txt" | "html";
type Range  = "all" | "7d" | "30d" | "90d";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDuration(startedAt: string, endedAt: string | null): string | undefined {
  if (!endedAt) return undefined;
  const secs = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  if (secs < 1) return undefined;
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

function getLastBackupLabel(): string {
  const ts = localStorage.getItem("dlite_last_backup");
  if (!ts) return "Never";
  const diff = Date.now() - Number(ts);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border themed-border overflow-hidden mb-6" style={{ background: "var(--surface)" }}>
      <div className="flex items-center gap-3 px-6 py-4 border-b themed-border">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
          <Icon size={16} style={{ color }} />
        </div>
        <h3 className="font-bold themed-text">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: color + "20", color }}>{children}</span>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function BackupPage() {
  const [format, setFormat]     = useState<Format>("json");
  const [range, setRange]       = useState<Range>("all");
  const [includeMedia, setIncludeMedia]     = useState(true);
  const [includeReactions, setIncludeReactions] = useState(true);
  const [includeCalls, setIncludeCalls]     = useState(true);
  const [encrypt, setEncrypt]   = useState(false);
  const [password, setPassword] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importPassword, setImportPassword] = useState("");
  const [importError, setImportError] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importNeedsPassword, setImportNeedsPassword] = useState(false);

  const [conversations, setConversations] = useState<{ id: string; name: string; count: number }[]>([]);
  const [selectedConv, setSelectedConv] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const [lastBackup, setLastBackup] = useState("Never");
  useEffect(() => { setLastBackup(getLastBackupLabel()); }, []);

  // Load conversation list
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("direct_messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (!data) return;
      const peerIds = new Set<string>();
      data.forEach((m: any) => {
        const pid = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        peerIds.add(pid);
      });

      const peers = await Promise.all([...peerIds].map(async pid => {
        const { data: p } = await supabase.from("profiles").select("id,display_name,username").eq("id", pid).single();
        const name = (p as any)?.display_name || (p as any)?.username || pid.slice(0, 8);
        const count = data.filter((m: any) => m.sender_id === pid || m.receiver_id === pid).length;
        return { id: pid, name, count };
      }));
      setConversations(peers);
    }
    load();
  }, []);

  async function doExport() {
    setExporting(true);
    setExportDone(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("display_name,username").eq("id", user.id).single();
      const myName = (profile as any)?.display_name || (profile as any)?.username || "Me";

      const sinceDate = (() => {
        if (range === "all") return null;
        const d = new Date();
        d.setDate(d.getDate() - Number(range.replace("d", "")));
        return d.toISOString();
      })();

      const peerIds = selectedConv === "all" ? conversations.map(c => c.id) : [selectedConv];

      for (const peerId of peerIds) {
        const peer = conversations.find(c => c.id === peerId);
        if (!peer) continue;

        let q = supabase
          .from("direct_messages")
          .select(`id, content, media_url, status, created_at, sender_id, reactions:message_reactions(emoji, user_id)`)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });
        if (sinceDate) q = q.gte("created_at", sinceDate);

        const { data: msgs } = await q;
        if (!msgs) continue;

        const messages: ExportMessage[] = msgs.map((m: any) => {
          const isMe = m.sender_id === user.id;
          const grouped: Record<string, number> = {};
          if (includeReactions) {
            (m.reactions || []).forEach((r: any) => { grouped[r.emoji] = (grouped[r.emoji] || 0) + 1; });
          }
          return {
            id: m.id,
            sender: isMe ? "me" : "them",
            senderName: isMe ? myName : peer.name,
            content: m.content || "",
            mediaUrl: includeMedia ? (m.media_url || undefined) : undefined,
            timestamp: m.created_at,
            reactions: Object.keys(grouped).length ? Object.entries(grouped).map(([emoji, count]) => ({ emoji, count })) : undefined,
          };
        });

        let calls: ExportCall[] = [];
        if (includeCalls) {
          const { data: callData } = await supabase
            .from("calls")
            .select("id,type,status,started_at,ended_at,caller_id")
            .or(`and(caller_id.eq.${user.id},receiver_id.eq.${peerId}),and(caller_id.eq.${peerId},receiver_id.eq.${user.id})`)
            .order("started_at", { ascending: true });

          calls = (callData || []).map((c: any) => ({
            id: c.id,
            type: c.type,
            status: c.status,
            startedAt: c.started_at,
            duration: formatDuration(c.started_at, c.ended_at),
            direction: c.caller_id === user.id ? "outgoing" : "incoming",
          }));
        }

        const timestamps = msgs.map((m: any) => m.created_at);
        const exportData: ExportData = {
          version: "1.0",
          app: "D-LITE",
          exportedAt: new Date().toISOString(),
          conversation: {
            peerId,
            peerName: peer.name,
            myId: user.id,
            myName,
            dateRange: { from: timestamps[0] || "", to: timestamps[timestamps.length - 1] || "" },
            messageCount: messages.length,
            messages,
            calls,
          },
        };

        let content = format === "json" ? toJSON(exportData) : format === "txt" ? toTXT(exportData) : toHTML(exportData);
        const mime  = format === "json" ? "application/json" : format === "txt" ? "text/plain" : "text/html";
        const ext   = format;
        const safeName = peer.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        let filename = `dlite_${safeName}_${new Date().toISOString().slice(0, 10)}.${ext}`;

        if (encrypt && password && format === "json") {
          content = await encryptExport(content, password);
          filename = filename.replace(".json", ".dlite.enc");
        }

        downloadFile(content, filename, mime);
        await new Promise(r => setTimeout(r, 200)); // stagger multi-file downloads
      }

      localStorage.setItem("dlite_last_backup", String(Date.now()));
      setLastBackup("Today");
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(file: File) {
    setImportFile(file);
    setImportData(null);
    setImportError("");
    setImportDone(false);
    setImportNeedsPassword(false);

    const text = await file.text();
    if (isEncrypted(text)) {
      setImportNeedsPassword(true);
      return;
    }
    parseImport(text);
  }

  function parseImport(text: string) {
    try {
      const data: ExportData = JSON.parse(text);
      if (data.app !== "D-LITE" || !data.conversation) throw new Error("Invalid D-LITE export file");
      setImportData(data);
    } catch {
      setImportError("Could not parse file. Make sure it's a valid D-LITE JSON export.");
    }
  }

  async function decryptImport() {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const text = await importFile.text();
      const plain = await decryptExport(text, importPassword);
      parseImport(plain);
      setImportNeedsPassword(false);
    } catch {
      setImportError("Wrong password or corrupted file.");
    } finally {
      setImportLoading(false);
    }
  }

  function saveToArchive() {
    if (!importData) return;
    const existing = JSON.parse(localStorage.getItem("dlite_archive") || "[]");
    existing.push(importData);
    localStorage.setItem("dlite_archive", JSON.stringify(existing));
    setImportDone(true);
    setImportData(null);
    setImportFile(null);
  }

  const mimeMap = { json: "application/json", txt: "text/plain", html: "text/html" };
  const fmtLabels = { json: "JSON — Structured + importable", txt: "Plain Text — Human readable", html: "HTML — Styled web page" };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <SettingsHeader
        title="Backup & Export"
        description="Export conversations, import archives, and keep your chat history safe."
      />

      {/* ── Export ── */}
      <Section title="Export Conversations" icon={Download} color="#8b5cf6">
        {/* Conversation selector */}
        <div className="mb-5">
          <label className="text-xs font-semibold themed-text-3 uppercase tracking-wider block mb-2">Conversation</label>
          <select
            value={selectedConv}
            onChange={e => setSelectedConv(e.target.value)}
            className="w-full bg-transparent border themed-border rounded-xl px-4 py-2.5 text-sm themed-text outline-none cursor-pointer"
            style={{ background: "var(--surface-2, var(--surface))" }}
          >
            <option value="all">All conversations ({conversations.length})</option>
            {conversations.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.count} msgs)</option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div className="mb-5">
          <label className="text-xs font-semibold themed-text-3 uppercase tracking-wider block mb-2">Format</label>
          <div className="grid grid-cols-3 gap-2">
            {(["json", "txt", "html"] as Format[]).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
                style={{
                  borderColor: format === f ? "var(--brand-text)" : "var(--border)",
                  background: format === f ? "rgba(139,92,246,0.08)" : "var(--surface-2, var(--surface))",
                }}>
                {f === "json" ? <FileJson size={20} style={{ color: format === f ? "var(--brand-text)" : "var(--text-muted)" }} />
                  : f === "txt" ? <FileText size={20} style={{ color: format === f ? "var(--brand-text)" : "var(--text-muted)" }} />
                  : <Globe size={20} style={{ color: format === f ? "var(--brand-text)" : "var(--text-muted)" }} />}
                <span className="text-xs font-semibold uppercase" style={{ color: format === f ? "var(--brand-text)" : "var(--text-muted)" }}>{f}</span>
              </button>
            ))}
          </div>
          <p className="text-xs themed-text-3 mt-2">{fmtLabels[format]}</p>
        </div>

        {/* Date range */}
        <div className="mb-5">
          <label className="text-xs font-semibold themed-text-3 uppercase tracking-wider block mb-2">Date Range</label>
          <div className="flex gap-2 flex-wrap">
            {([["all", "All time"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["90d", "Last 90 days"]] as [Range, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setRange(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  borderColor: range === v ? "var(--brand-text)" : "var(--border)",
                  background: range === v ? "rgba(139,92,246,0.08)" : "transparent",
                  color: range === v ? "var(--brand-text)" : "var(--text-muted)",
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Include toggles */}
        <div className="mb-5 flex flex-wrap gap-3">
          {[
            ["Include Media URLs", includeMedia, setIncludeMedia],
            ["Include Reactions", includeReactions, setIncludeReactions],
            ["Include Call History", includeCalls, setIncludeCalls],
          ].map(([label, val, setter]: any) => (
            <button key={label as string} onClick={() => setter(!val)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
              style={{
                borderColor: val ? "var(--brand-text)" : "var(--border)",
                background: val ? "rgba(139,92,246,0.08)" : "transparent",
                color: val ? "var(--brand-text)" : "var(--text-muted)",
              }}>
              {val ? <Check size={12} /> : <div style={{ width: 12 }} />} {label as string}
            </button>
          ))}
        </div>

        {/* Encryption — JSON only */}
        {format === "json" && (
          <div className="mb-5 p-4 rounded-xl border themed-border" style={{ background: "var(--surface-2, var(--surface))" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield size={15} style={{ color: encrypt ? "#10b981" : "var(--text-muted)" }} />
                <span className="text-sm font-semibold themed-text">Password Encrypt</span>
                {encrypt && <Badge color="#10b981">AES-256-GCM</Badge>}
              </div>
              <button onClick={() => { setEncrypt(v => !v); setPassword(""); }}
                className="w-10 h-5 rounded-full transition-all relative"
                style={{ background: encrypt ? "#10b981" : "var(--border)" }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: encrypt ? "22px" : "2px" }} />
              </button>
            </div>
            {encrypt && (
              <input value={password} onChange={e => setPassword(e.target.value)} type="password"
                placeholder="Enter encryption password…"
                className="w-full bg-transparent border themed-border rounded-lg px-3 py-2 text-sm themed-text outline-none" />
            )}
            {encrypt && <p className="text-[11px] themed-text-3 mt-2">PBKDF2 (250k iterations) + AES-256-GCM. Keep your password safe — it cannot be recovered.</p>}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={doExport}
          disabled={exporting || (encrypt && !password)}
          className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: exportDone ? "#10b981" : "var(--grad-brand)" }}>
          {exporting ? <><Loader2 size={16} className="animate-spin" /> Exporting…</>
            : exportDone ? <><Check size={16} /> Exported successfully!</>
            : <><Download size={16} /> Export {selectedConv === "all" ? `All (${conversations.length})` : "Chat"}</>}
        </motion.button>
      </Section>

      {/* ── Import ── */}
      <Section title="Import Archive" icon={Upload} color="#3b82f6">
        <input ref={fileRef} type="file" accept=".json,.dlite.enc" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }} />

        {!importFile ? (
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer hover:border-[var(--brand-text)] transition-colors"
            style={{ borderColor: "var(--border)" }}>
            <Upload size={28} style={{ color: "var(--text-muted)" }} />
            <div className="text-center">
              <p className="text-sm font-semibold themed-text">Click to select export file</p>
              <p className="text-xs themed-text-3 mt-1">Supports .json and encrypted .dlite.enc files</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 p-3 rounded-xl border themed-border mb-4" style={{ background: "var(--surface-2, var(--surface))" }}>
              <FileJson size={20} style={{ color: "var(--brand-text)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium themed-text truncate">{importFile.name}</p>
                <p className="text-xs themed-text-3">{(importFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => { setImportFile(null); setImportData(null); setImportError(""); setImportNeedsPassword(false); }}
                className="themed-text-3 hover:text-[var(--danger)]"><Trash2 size={15} /></button>
            </div>

            {importNeedsPassword && (
              <div className="mb-4">
                <p className="text-sm themed-text mb-2 flex items-center gap-2"><Shield size={14} style={{ color: "#10b981" }} /> This file is encrypted</p>
                <div className="flex gap-2">
                  <input value={importPassword} onChange={e => setImportPassword(e.target.value)} type="password"
                    placeholder="Enter password…"
                    className="flex-1 bg-transparent border themed-border rounded-xl px-3 py-2 text-sm themed-text outline-none" />
                  <button onClick={decryptImport} disabled={!importPassword || importLoading}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: "var(--grad-brand)" }}>
                    {importLoading ? <Loader2 size={15} className="animate-spin" /> : "Decrypt"}
                  </button>
                </div>
                {importError && <p className="text-xs text-red-400 mt-2">{importError}</p>}
              </div>
            )}

            {importData && (
              <div className="rounded-xl border themed-border overflow-hidden mb-4">
                <div className="px-4 py-3 border-b themed-border flex items-center gap-2">
                  <Eye size={14} style={{ color: "var(--brand-text)" }} />
                  <span className="text-sm font-semibold themed-text">Preview</span>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="themed-text-3">Peer</span><span className="font-medium themed-text">{importData.conversation.peerName}</span></div>
                  <div className="flex justify-between"><span className="themed-text-3">Messages</span><span className="font-medium themed-text">{importData.conversation.messageCount}</span></div>
                  <div className="flex justify-between"><span className="themed-text-3">Calls</span><span className="font-medium themed-text">{importData.conversation.calls.length}</span></div>
                  <div className="flex justify-between"><span className="themed-text-3">Exported</span><span className="font-medium themed-text">{new Date(importData.exportedAt).toLocaleDateString()}</span></div>
                </div>
                <div className="px-4 pb-3">
                  <p className="text-[11px] themed-text-3">Will be saved to local archive (Settings → Backup → View Archives)</p>
                </div>
              </div>
            )}

            {importData && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={saveToArchive}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: "#3b82f6" }}>
                <Upload size={16} /> Save to Archive
              </motion.button>
            )}

            {importDone && (
              <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: "#10b981" }}>
                <Check size={15} /> Imported successfully to local archive
              </div>
            )}

            {importError && !importNeedsPassword && (
              <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: "#ef4444" }}>
                <AlertCircle size={15} /> {importError}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Auto backup status ── */}
      <Section title="Backup Status" icon={Clock} color="#f59e0b">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium themed-text">Last backup</p>
            <p className="text-xs themed-text-3 mt-0.5">{lastBackup}</p>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={doExport}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "var(--grad-brand)" }}>
            Backup Now
          </motion.button>
        </div>
        <div className="mt-4 p-3 rounded-xl text-xs themed-text-3" style={{ background: "var(--surface-2, var(--surface))" }}>
          💡 Tip: Export as encrypted JSON for maximum security. Keep the file and password in a safe place — D-LITE cannot recover encrypted exports.
        </div>
      </Section>
    </div>
  );
}
