import { Greeting } from "@/features/dashboard/components/Greeting";
import { StatRow } from "@/features/dashboard/components/StatRow";
import { RecentChatsGrid } from "@/features/dashboard/components/RecentChatsGrid";
import { RecentCallsCard } from "@/features/dashboard/components/RecentCallsCard";
import { getUser } from "@/core/auth/get-user";
import { getRecentCalls } from "@/core/data/dashboard";

export default async function DashboardPage() {
  const user = await getUser();
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const firstName = fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const calls = user ? await getRecentCalls(user.id) : [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <Greeting name={firstName} />
      <StatRow />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <RecentChatsGrid />
        <RecentCallsCard calls={calls} />
      </div>
    </div>
  );
}
