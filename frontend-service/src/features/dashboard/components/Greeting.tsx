export function Greeting({ name = "there" }: { name?: string }) {
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const emoji = hour < 12 ? "☀️" : hour < 17 ? "👋" : "🌙";

  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
        {date}
      </p>
      <h1 className="text-3xl font-black mb-1" style={{ color: "var(--text-primary)" }}>
        {greeting}, <span className="brand-grad-text">{name}</span> {emoji}
      </h1>
      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
        Here&apos;s what&apos;s happening today.
      </p>
    </div>
  );
}
