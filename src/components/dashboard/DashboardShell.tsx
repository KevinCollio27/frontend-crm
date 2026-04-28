"use client";

import { type ReactNode } from "react";
import { AIAssistantProvider, useAIAssistant } from "@/context/AIAssistantContext";
import { AIAssistantPanel } from "@/components/dashboard/ai/AIAssistantPanel";
import { cn } from "@/lib/utils";

function Shell({ children }: { children: ReactNode }) {
  const { isOpen } = useAIAssistant();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
