"use client";

import { useEffect, useState } from "react";

interface DebugInfo {
  timezone: string;
  locale: string;
  userAgent: string;
  timestamp: string;
}

export default function HydrationDebug({ serverTime }: { serverTime: string }) {
  const [clientInfo, setClientInfo] = useState<DebugInfo | null>(null);
  const [mismatch, setMismatch] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const info: DebugInfo = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
      userAgent: navigator.userAgent.slice(0, 50),
      timestamp: now.toISOString(),
    };
    setClientInfo(info);

    // Check for date formatting mismatches
    const testDate = new Date("2024-01-15T12:00:00Z");
    const formatted = testDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (formatted !== "Jan 15") {
      setMismatch(`Date format mismatch: expected "Jan 15", got "${formatted}"`);
    }
  }, []);

  // Temporarily always show for debugging - remove this component when done
  // if (process.env.NODE_ENV === "production" && !mismatch) {
  //   return null;
  // }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-900 text-yellow-100 p-2 text-xs font-mono z-50">
      <div><strong>Server:</strong> time={serverTime}</div>
      {clientInfo && (
        <div><strong>Client:</strong> tz={clientInfo.timezone} locale={clientInfo.locale} time={clientInfo.timestamp}</div>
      )}
      {mismatch && <div className="text-red-400"><strong>MISMATCH:</strong> {mismatch}</div>}
    </div>
  );
}
