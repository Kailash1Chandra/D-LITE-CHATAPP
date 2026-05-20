import { DockNav } from "@/shared/components/DockNav";
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
      className="h-screen w-full overflow-hidden"
      style={{ background: "var(--canvas-bg)", position: "relative" }}
    >
      {/* Aurora orbs — fixed z-0 */}
      <AuroraBackground />

      {/* Main content — fills entire width now, dock is floating */}
      <main
        className="h-full overflow-y-auto"
        style={{ position: "relative", zIndex: 5, paddingBottom: 96 }}
      >
        {children}
      </main>

      {/* Floating bottom dock — fixed z-100 */}
      <DockNav userInitials={getInitials(fullName)} userAvatarUrl={avatarUrl} />

      <CallListener />
      <KeepAlive />
    </div>
  );
}
