"use client"

import * as React from "react"
import { PlusCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface SingleSelectOption {
  value: string
  label: string
  meta?: React.ReactNode
}

export function SingleSelectFilter({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: SingleSelectOption[]
  selected: string
  onChange: (value: string) => void
}) {
  const selectedOption = options.find((o) => o.value === selected)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
      >
        <PlusCircleIcon className="size-4" />
        {title}
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-auto" />
        <span className="inline-block max-w-32 truncate align-middle rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
          {selectedOption?.label ?? "…"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-60 min-w-44 overflow-y-auto">
        <DropdownMenuRadioGroup value={selected} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
              {option.meta}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
