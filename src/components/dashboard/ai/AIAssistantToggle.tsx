"use client";

import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAIAssistant } from "@/context/AIAssistantContext";
import { cn } from "@/lib/utils";

export function AIAssistantToggle() {
  const { toggle, isOpen } = useAIAssistant();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon"
              onClick={toggle}
              className={cn(
                "rounded-full border-0 text-white shadow-sm transition-all",
                isOpen
                  ? "bg-violet-700 hover:bg-violet-800"
                  : "bg-linear-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              )}
            />
          }
        >
          <SparklesIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <SparklesIcon className="size-3" />
          Asistente IA
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
