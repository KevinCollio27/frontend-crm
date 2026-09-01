"use client"

import * as React from "react"
import { AlertTriangleIcon, CalendarXIcon, ClockIcon, UserXIcon } from "lucide-react"
import { followUpService } from "@/services/follow-up.service"
import type { FollowUpStats } from "@/types/follow-up"
import { StatTile, Tile, TileSkeleton } from "./SalesStatTile"

// 4 KPIs de "Seguimiento" — backend (follow-up-stats/stats) ya existía completo, portado del
// legacy, solo faltaba conectarlo. A diferencia de Ventas, acá no hay trend/periodo anterior
// (el backend no lo calcula para estos KPIs), así que las tiles no muestran esa línea.
export function FollowUpKpis() {
  const [stats, setStats] = React.useState<FollowUpStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    followUpService.getStats()
      .then((res) => { if (!cancelled) setStats(res) })
      .catch(() => { if (!cancelled) setStats(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <TileSkeleton key={i} />)}
      </div>
    )
  }

  const tiles: Tile[] = [
    {
      icon: ClockIcon, title: "Días Sin Contacto", subtitle: "Oportunidades abiertas",
      value: stats?.avgDaysWithoutContact.value ?? "0",
      tooltip: "Promedio de días desde el último movimiento registrado, en oportunidades abiertas."
    },
    {
      icon: AlertTriangleIcon, title: "Oportunidades en Riesgo", subtitle: "20+ días sin contacto",
      value: stats?.atRiskOpportunities.value ?? "0",
      tooltip: "Oportunidades abiertas con 20 días o más sin ningún movimiento registrado."
    },
    {
      icon: CalendarXIcon, title: "Tareas Atrasadas", subtitle: "Vencidas sin completar",
      value: stats?.overdueTasks.value ?? "0",
      tooltip: "Actividades de seguimiento con fecha vencida, aún no marcadas como completadas."
    },
    {
      icon: UserXIcon, title: "Nunca Contactadas", subtitle: "Oportunidades abiertas",
      value: stats?.neverContacted.value ?? "0%",
      tooltip: stats?.neverContacted.description ? `${stats.neverContacted.description} nunca tuvieron un movimiento registrado.` : undefined
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => <StatTile key={tile.title} tile={tile} />)}
    </div>
  )
}
