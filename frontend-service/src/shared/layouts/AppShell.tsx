import { IconRail } from "@/shared/components/IconRail";
import { AuroraBackground } from "@/shared/components/AuroraBackground";
import { getUser, getInitials } from "@/core/auth/get-user";
import { CallListener } from "@/features/calls/components/CallListener";
import { KeepAlive } from "@/shared/components/KeepAlive";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: "var(--canvas-bg)", position: "relative" }}
    >
      {/* Aurora animated background — fixed z-0, visible through glass panels */}
      <AuroraBackground />

      {/* Icon navigation rail — z-10, glass */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <IconRail userInitials={getInitials(fullName)} userAvatarUrl={avatarUrl} />
      </div>

      {/* Main content — z-5, above aurora */}
      <main
        className="flex-1 h-full overflow-y-auto"
        style={{ position: "relative", zIndex: 5 }}
      >
        {children}
      </main>

      <CallListener />
      <KeepAlive />
    </div>
  );
}
