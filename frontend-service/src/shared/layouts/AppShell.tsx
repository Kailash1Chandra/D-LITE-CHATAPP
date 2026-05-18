import { IconRail } from "@/shared/components/IconRail";
import { getUser, getInitials } from "@/core/auth/get-user";
import { CallListener } from "@/features/calls/components/CallListener";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="flex h-screen w-full overflow-hidden themed-canvas">
      <IconRail userInitials={getInitials(fullName)} userAvatarUrl={avatarUrl} />
      <main className="flex-1 h-full overflow-y-auto">
        {children}
      </main>
      <CallListener />
    </div>
  );
}
