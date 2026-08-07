"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { AIAssistantProvider, useAIAssistant } from "@/context/AIAssistantContext";
import { AIAssistantPanel } from "@/components/dashboard/ai/AIAssistantPanel";
import { useSessionStore } from "@/store/session.store";
import { PlatformAdminBanner } from "@/components/dashboard/PlatformAdminBanner";
import { cn } from "@/lib/utils";

function Shell({ children }: { children: ReactNode }) {
  const { isOpen }  = useAIAssistant();
  const workspaceId = useSessionStore((s) => s.workspaceId);

  // Only remount children when the user actively switches workspaces
  // (null → id on initial hydration must NOT cause a remount)
  const [resetKey, setResetKey] = useState(0);
  const prevIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevIdRef.current !== null && workspaceId !== null && workspaceId !== prevIdRef.current) {
      setResetKey((k) => k + 1);
    }
    if (workspaceId !== null) prevIdRef.current = workspaceId;
  }, [workspaceId]);

  return (
    <div className="flex h-full overflow-hidden">
      <div key={resetKey} className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PlatformAdminBanner />
        {children}
      </div>
      <div
        className={cn(
          "shrink-0 overflow-hidden transition-[width] duration-300",
          isOpen ? "w-80 border-l" : "w-0"
        )}
      >
        <AIAssistantPanel />
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <AIAssistantProvider>
      <Shell>{children}</Shell>
    </AIAssistantProvider>
  );
}
