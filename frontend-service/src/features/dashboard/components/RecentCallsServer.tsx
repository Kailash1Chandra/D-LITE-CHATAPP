import { getUser } from "@/core/auth/get-user";
import { getRecentCalls } from "@/core/data/dashboard";
import { RecentCallsCard } from "./RecentCallsCard";

export async function RecentCallsServer() {
  const user = await getUser();
  const calls = user ? await getRecentCalls(user.id) : [];
  return <RecentCallsCard calls={calls} />;
}
