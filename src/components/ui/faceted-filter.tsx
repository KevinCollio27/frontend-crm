"use client"

import * as React from "react"
import { PlusCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface FacetedFilterOption {
  value: string
  label: string
}

export function KanbanFacetedFilter({
  title,
  options,
  selected,
  onChange,
  single = false,
}: {
  title: string
  options: FacetedFilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
  single?: boolean
}) {
  const selectedSet = new Set(selected)

  const toggle = (value: string) => {
    if (single) {
      onChange(selectedSet.has(value) ? [] : [value])
      return
    }
    const next = new Set(selectedSet)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange(Array.from(next))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}>
        <PlusCircleIcon className="size-4" />
        {title}
        {selectedSet.size > 0 && (
          <>
            <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-auto" />
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">
              {selectedSet.size}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedSet.has(option.value)}
            onCheckedChange={() => toggle(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selectedSet.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onChange([])}
            >
              Limpiar filtros
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
