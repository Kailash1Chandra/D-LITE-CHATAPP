"use client";

/* Fixed aurora orbs that shine through all glass panels.
   In light mode, aurora vars are near-transparent so orbs are invisible. */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed", inset: 0,
        overflow: "hidden", pointerEvents: "none", zIndex: 0,
      }}
    >
      {/* Violet — top left */}
      <div style={{
        position: "absolute", top: "-5%", left: "5%",
        width: 800, height: 800, borderRadius: "50%",
        background: "radial-gradient(circle, var(--aurora-1) 0%, transparent 70%)",
        filter: "blur(72px)",
        animation: "aurora-1 28s ease-in-out infinite",
      }} />

      {/* Cyan — right center */}
      <div style={{
        position: "absolute", top: "25%", right: "-5%",
        width: 650, height: 650, borderRadius: "50%",
        background: "radial-gradient(circle, var(--aurora-2) 0%, transparent 70%)",
        filter: "blur(80px)",
        animation: "aurora-2 36s ease-in-out infinite",
        animationDelay: "-14s",
      }} />

      {/* Emerald — bottom center */}
      <div style={{
        position: "absolute", bottom: "-5%", left: "28%",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, var(--aurora-3) 0%, transparent 70%)",
        filter: "blur(90px)",
        animation: "aurora-3 44s ease-in-out infinite",
        animationDelay: "-25s",
      }} />

      {/* Pink — bottom left */}
      <div style={{
        position: "absolute", bottom: "5%", left: "-5%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, var(--aurora-4, var(--aurora-1)) 0%, transparent 70%)",
        filter: "blur(80px)",
        animation: "aurora-4 52s ease-in-out infinite",
        animationDelay: "-35s",
      }} />
    </div>
  );
}
