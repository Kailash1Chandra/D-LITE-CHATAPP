import { Greeting } from "@/features/dashboard/components/Greeting";
import { FavouriteChats } from "@/features/dashboard/components/FavouriteChats";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";
import { getUser } from "@/core/auth/get-user";

export default async function DashboardPage() {
  const user = await getUser();
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const firstName = fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <Greeting name={firstName} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <FavouriteChats />
        <NotificationsPanel />
      </div>
    </div>
  );
}
