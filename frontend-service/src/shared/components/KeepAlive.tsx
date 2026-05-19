"use client";

import { useEffect } from "react";

const SERVICES = [
  process.env.NEXT_PUBLIC_REALTIME_WS_URL,
  process.env.NEXT_PUBLIC_CALLS_API_URL,
  process.env.NEXT_PUBLIC_CORE_API_URL,
  process.env.NEXT_PUBLIC_AI_API_URL,
].filter(Boolean) as string[];

// Ping Render services every 10 min so they don't sleep on the free tier.
// Each ping is a tiny GET /health request — if it fails, silently ignored.
export function KeepAlive() {
  useEffect(() => {
    if (SERVICES.length === 0) return;

    function ping() {
      SERVICES.forEach(url => {
        const base = url.replace(/^wss?:\/\//, "https://").replace(/\/$/, "");
        // no-cors: we only care about keeping the service alive, not reading
        // the response — avoids CORS header requirement on health endpoints
        fetch(`${base}/health`, { method: "GET", cache: "no-store", mode: "no-cors" }).catch(() => {});
      });
    }

    ping(); // ping immediately on mount
    const id = setInterval(ping, 10 * 60 * 1000); // every 10 min
    return () => clearInterval(id);
  }, []);

  return null;
}
