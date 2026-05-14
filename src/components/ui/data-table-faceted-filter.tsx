"use client"

import { type Column } from "@tanstack/react-table"
import { PlusCircleIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

interface Option {
  label: string
  value: string
  icon?: React.ReactNode
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  options: Option[]
  counts?: Map<string, number>
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  counts,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set((column.getFilterValue() as string[]) ?? [])
  const facetedValues = counts ?? column.getFacetedUniqueValues?.()
  const selectedArray = Array.from(selectedValues)

  const toggle = (value: string) => {
    const updated = new Set(selectedValues)
    if (updated.has(value)) {
      updated.delete(value)
    } else {
      updated.add(value)
    }
    column.setFilterValue(updated.size > 0 ? Array.from(updated) : undefined)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 border-dashed" />
        }
      >
        <PlusCircleIcon className="size-4" />
        {title}
        {selectedValues.size > 0 && (
          <>
            <Separator
              orientation="vertical"
              className="mx-1 data-vertical:h-4 data-vertical:self-auto"
            />
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              {selectedArray.length}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedValues.has(option.value)}
            onCheckedChange={() => toggle(option.value)}
          >
            {option.icon && <span>{option.icon}</span>}
            <span>{option.label}</span>
            {facetedValues?.get(option.value) != null && (
              <span className="ml-auto tabular-nums text-xs text-muted-foreground">
                {facetedValues.get(option.value)}
              </span>
            )}
          </DropdownMenuCheckboxItem>
        ))}
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => column.setFilterValue(undefined)}
            >
              Limpiar filtros
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
