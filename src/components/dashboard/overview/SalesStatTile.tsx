"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Tile compartida por las filas de KPIs de Ventas (Oportunidades y Cotizaciones) — mismo
// layout/tema que SimpleStatCard (fondo #131313 exacto en oscuro), pero recibe el KPI ya
// resuelto en vez de buscarlo por kpiKey, porque acá vienen de 2 fuentes distintas
// (dashboard-stats y sales-stats) combinadas en un solo fetch por componente padre.
export interface Tile {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  value: string
  trend?: { value: string; state: "up" | "down" | "flat" }
  trendFooter: string
}

function trendColorClass(state: "up" | "down" | "flat" | undefined) {
  if (!state || state === "flat") return "text-muted-foreground dark:text-neutral-400"
  return state === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
}

export function StatTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon
  const sign = tile.trend ? (tile.trend.state === "up" ? "+" : tile.trend.state === "down" ? "-" : "") : ""
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white px-6 py-5 ring-1 ring-foreground/10 dark:bg-[#131313] dark:ring-0">
      <div className="flex items-center gap-2.5">
        <Icon className="size-8 text-muted-foreground dark:text-neutral-400" />
        <div>
          <p className="text-sm text-muted-foreground dark:text-neutral-400">{tile.title}</p>
          <p className="text-base font-semibold text-foreground dark:text-white">{tile.subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-3xl font-bold text-foreground dark:text-white">{tile.value}</p>
        <p className="text-sm">
          {tile.trend && (
            <span className={cn("font-medium", trendColorClass(tile.trend.state))}>
              {sign}{tile.trend.value}
            </span>
          )}{" "}
          <span className="text-muted-foreground dark:text-neutral-400">{tile.trendFooter}</span>
        </p>
      </div>
    </div>
  )
}

export function TileSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white px-6 py-5 ring-1 ring-foreground/10 dark:bg-[#131313] dark:ring-0">
      <div className="flex items-center gap-2.5">
        <div className="size-8 shrink-0 animate-pulse rounded bg-muted" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-8 w-28 animate-pulse rounded bg-muted" />
        <div className="h-3 w-36 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
