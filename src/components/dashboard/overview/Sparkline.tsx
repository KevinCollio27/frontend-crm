"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { DashboardTrendState } from "@/types/dashboard"

interface SparklinePoint {
  label: string
  value: number
}

interface SparklineProps {
  data: SparklinePoint[]
  trendState: DashboardTrendState
  goodDirection: "up" | "down"
  onHoverChange?: (point: SparklinePoint | null) => void
  className?: string
}

const WIDTH = 200
const HEIGHT = 40
const PADDING = 5

// Curva suave entre puntos vía control points en el punto medio de x — no hace falta
// una librería de charts para un sparkline de 8 puntos.
function buildSmoothPath(points: { x: number; y: number }[]): string {
  let d = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]!
    const p1 = points[i]!
    const midX = (p0.x + p1.x) / 2
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`
  }
  return d
}

export function Sparkline({ data, trendState, goodDirection, onHoverChange, className }: SparklineProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

  if (data.length < 2) return null

  // de-enfasis para el trazo; el color de tendencia queda solo en el punto del
  // período actual (y en el punto bajo el cursor) — nunca en toda la línea.
  const isGoodNews = trendState === goodDirection
  const accentClass = trendState === "flat"
    ? "fill-muted-foreground"
    : isGoodNews
      ? "fill-emerald-500 dark:fill-emerald-400"
      : "fill-red-500 dark:fill-red-400"

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = data.map((d, i) => ({
    x: PADDING + (i / (data.length - 1)) * (WIDTH - PADDING * 2),
    y: HEIGHT - PADDING - ((d.value - min) / range) * (HEIGHT - PADDING * 2),
  }))

  const path = buildSmoothPath(points)
  const last = points[points.length - 1]!
  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const relativeX = ((e.clientX - rect.left) / rect.width) * WIDTH
    let nearest = 0
    let nearestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX)
      if (dist < nearestDist) { nearestDist = dist; nearest = i }
    })
    setHoverIndex(nearest)
    onHoverChange?.(data[nearest] ?? null)
  }

  function handleLeave() {
    setHoverIndex(null)
    onHoverChange?.(null)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("h-10 w-full", className)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <path d={path} fill="none" className="stroke-muted-foreground/40" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {hovered && (
        <line x1={hovered.x} y1={0} x2={hovered.x} y2={HEIGHT} className="stroke-muted-foreground/30" strokeWidth={1} />
      )}

      {/* punto del período actual — el único lugar donde el trazo lleva el color de tendencia */}
      <circle cx={last.x} cy={last.y} r={3} className={cn(accentClass, "stroke-card")} strokeWidth={2} />

      {hovered && hoverIndex !== points.length - 1 && (
        <circle cx={hovered.x} cy={hovered.y} r={3} className="fill-foreground stroke-card" strokeWidth={2} />
      )}
    </svg>
  )
}
