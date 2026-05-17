import React from "react";
import { Users } from "lucide-react";

export default function GroupsIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-canvas relative z-0">
      <div className="flex h-24 w-24 items-center justify-center rounded-full brand-grad mb-6 shadow-accent opacity-80">
        <Users className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold themed-text mb-2">Your Groups</h2>
      <p className="themed-text-3 max-w-sm">
        Select a group from the sidebar or create a new one to start collaborating.
      </p>
    </div>
  );
}
