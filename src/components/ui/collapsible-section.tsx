"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({ title, description, icon: Icon, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border bg-background">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5">
        <div className="flex items-center gap-2.5">
          <Icon className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold tracking-tight">{title}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">{children}</CollapsibleContent>
    </Collapsible>
  )
}
