import React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/Button";

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6 flex-col text-center">
      <div className="w-20 h-20 rounded-3xl brand-grad flex items-center justify-center shadow-accent text-white mb-8">
        <AlertTriangle size={40} />
      </div>
      <h1 className="text-4xl font-extrabold themed-text mb-4">404 - Page Not Found</h1>
      <p className="themed-text-3 mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/dashboard">
        <Button variant="primary" size="lg">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
