"use client";

import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function BellButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon"
              className="rounded-full text-white bg-amber-500"
            />
          }
        >
          <BellIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <BellIcon className="size-3" />
          Notificaciones
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
