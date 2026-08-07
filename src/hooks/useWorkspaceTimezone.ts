import { useEffect, useState } from "react"
import { workspaceService } from "@/services/workspace.service"

// Fallback mientras carga (o si falla) — no bloquea la UI por esto.
const DEFAULT_TIMEZONE = "America/Santiago"

// Cache a nivel de módulo, compartido entre todos los componentes que usen el hook —
// mismo patrón que _teamCache en CreateActivitySheet — evita repetir el fetch por cada uno.
let _cache: { value: string; ts: number } | null = null
const CACHE_TTL = 5 * 60_000

export function useWorkspaceTimezone(): string {
  const [timezone, setTimezone] = useState(_cache?.value ?? DEFAULT_TIMEZONE)

  useEffect(() => {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
      setTimezone(_cache.value)
      return
    }
    workspaceService.get()
      .then((ws) => {
        const value = ws.timezone || DEFAULT_TIMEZONE
        _cache = { value, ts: Date.now() }
        setTimezone(value)
      })
      .catch(() => {})
  }, [])

  return timezone
}
