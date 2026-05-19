import { MessageSquare, Users, PhoneCall, Zap } from "lucide-react";
import { StatCard } from "./StatCard";
import { createClient } from "@/core/auth/supabase-server";
import { getUser } from "@/core/auth/get-user";

export async function StatRow() {
  const user = await getUser();
  let messages = 0, groups = 0, calls = 0;

  if (user) {
    const supabase = await createClient();
    const [msgRes, groupRes, callRes] = await Promise.all([
      supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
      supabase
        .from("group_members")
        .select("group_id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`),
    ]);
    messages = msgRes.count ?? 0;
    groups = groupRes.count ?? 0;
    calls = callRes.count ?? 0;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <StatCard
        label="Messages"
        value={messages}
        icon={<MessageSquare size={18} />}
        gradient="linear-gradient(135deg,#7c3aed,#a855f7)"
      />
      <StatCard
        label="Calls"
        value={calls}
        icon={<PhoneCall size={18} />}
        gradient="linear-gradient(135deg,#ec4899,#f43f5e)"
      />
      <StatCard
        label="Groups"
        value={groups}
        icon={<Users size={18} />}
        gradient="linear-gradient(135deg,#0ea5e9,#6366f1)"
      />
      <StatCard
        label="AI Tasks"
        value={0}
        icon={<Zap size={18} />}
        gradient="linear-gradient(135deg,#10b981,#06b6d4)"
      />
    </div>
  );
}
