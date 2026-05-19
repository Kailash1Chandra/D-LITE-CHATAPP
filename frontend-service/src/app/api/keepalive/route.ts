import { NextResponse } from "next/server";

const SERVICES = [
  process.env.NEXT_PUBLIC_REALTIME_WS_URL,
  process.env.NEXT_PUBLIC_CALLS_API_URL,
  process.env.NEXT_PUBLIC_CORE_API_URL,
  process.env.NEXT_PUBLIC_AI_API_URL,
].filter(Boolean) as string[];

export async function GET() {
  const results = await Promise.allSettled(
    SERVICES.map((url) => {
      const base = url.replace(/^wss?:\/\//, "https://").replace(/\/$/, "");
      return fetch(`${base}/health`, { cache: "no-store" }).then((r) => ({
        url: base,
        ok: r.ok,
        status: r.status,
      }));
    })
  );

  const summary = results.map((r, i) => {
    const base = SERVICES[i].replace(/^wss?:\/\//, "https://").replace(/\/$/, "");
    if (r.status === "fulfilled") return r.value;
    return { url: base, ok: false, error: "unreachable" };
  });

  return NextResponse.json({ pings: summary });
}
