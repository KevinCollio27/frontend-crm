"use client"

import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ChipListProps {
  items: string[]
  max?: number
}

export function ChipList({ items, max = 4 }: ChipListProps) {
  if (!items.length) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  const visible = items.slice(0, max)
  const overflow = items.slice(max)

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
        {overflow.length > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={<span />}
              className="inline-flex cursor-default items-center rounded-md border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              +{overflow.length}
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              <div className="space-y-0.5">
                {overflow.map((item, i) => (
                  <div key={`${item}-${i}`}>{item}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
