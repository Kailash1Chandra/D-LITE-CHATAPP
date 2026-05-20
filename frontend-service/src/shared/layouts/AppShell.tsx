import { TopNav } from "@/shared/components/TopNav";
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
      className="h-screen w-full overflow-hidden flex flex-col"
      style={{ background: "var(--canvas-bg)", position: "relative" }}
    >
      {/* Aurora orbs — fixed z-0 */}
      <AuroraBackground />

      {/* Top navigation bar */}
      <TopNav userInitials={getInitials(fullName)} userAvatarUrl={avatarUrl} />

      {/* Page content — fills remaining height */}
      <main
        className="flex-1 overflow-hidden"
        style={{ position: "relative", zIndex: 5 }}
      >
        {children}
      </main>

      <CallListener />
      <KeepAlive />
    </div>
  );
}
