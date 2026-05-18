"use client";

import { useRouter } from "next/navigation";
import { useIncomingCall } from "../hooks/use-incoming-call";
import { IncomingCallOverlay } from "./IncomingCallOverlay";

export function CallListener() {
  const router = useRouter();
  const { incomingCall, accept, decline } = useIncomingCall();

  async function handleAccept() {
    const call = await accept();
    if (call) {
      router.push(`/call/${call.id}?type=${call.type}`);
    }
  }

  return (
    <IncomingCallOverlay
      call={incomingCall}
      onAccept={handleAccept}
      onDecline={decline}
    />
  );
}
