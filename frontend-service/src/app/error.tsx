"use client";

import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real production app, log this error to an APM/logging service (e.g. Sentry)
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-canvas px-6 flex-col text-center font-sans">
          <div className="w-20 h-20 rounded-3xl bg-danger/10 border-2 border-danger/20 flex items-center justify-center text-danger mb-8">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-4xl font-extrabold themed-text mb-4">Something went wrong</h1>
          <p className="themed-text-3 mb-8 max-w-md">
            We've encountered an unexpected error. Our engineering team has been notified.
          </p>
          <div className="flex gap-4">
            <Button variant="primary" size="lg" onClick={() => reset()}>
              Try again
            </Button>
            <Button variant="secondary" size="lg" onClick={() => window.location.href = "/"}>
              Go Home
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
