"use client";

import { useEffect } from "react";

// Pings all Render services via a server-side proxy every 10 min.
// Routing through /api/keepalive avoids ERR_BLOCKED_BY_CLIENT from ad blockers
// that intercept direct requests to external domains.
export function KeepAlive() {
  useEffect(() => {
    function ping() {
      fetch("/api/keepalive", { cache: "no-store" }).catch(() => {});
    }

    ping();
    const id = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
