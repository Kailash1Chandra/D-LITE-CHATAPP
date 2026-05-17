import React from "react";
import { MessageSquare } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-canvas relative z-0">
      <div className="flex h-24 w-24 items-center justify-center rounded-full brand-grad mb-6 shadow-accent opacity-80">
        <MessageSquare className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold themed-text mb-2">Your Messages</h2>
      <p className="themed-text-3 max-w-sm">
        Select a conversation from the sidebar or start a new chat to begin messaging.
      </p>
    </div>
  );
}
