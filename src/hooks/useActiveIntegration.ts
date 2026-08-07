import * as React from "react"
import { integrationService } from "@/services/integration.service"
import type { WorkspaceIntegrationRaw } from "@/types/integration"

// Gmail/Google Calendar son integraciones INDIVIDUALES — cada miembro conecta
// la suya (ver integration.route.ts: "individuales, cualquier miembro conecta
// la suya"). `getWorkspaceIntegrations()` devuelve TODAS las del workspace,
// no solo las del usuario actual — el backend ya marca cada una con
// `connected_by: "me" | "other"` (comparando contra el userId del token), así
// que acá hay que filtrar por "me" explícitamente. Sin este filtro, la
// primera conexión activa del workspace (de cualquier persona) se usaría
// para todos — mandaría correos/eventos desde la cuenta de otro usuario.
export function useActiveIntegration(providerKey: string) {
  const [connection, setConnection] = React.useState<WorkspaceIntegrationRaw | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    integrationService
      .getWorkspaceIntegrations()
      .then((connections) => {
        if (cancelled) return
        const conn = connections.find((c) => c.provider_key === providerKey && c.is_active && c.connected_by === "me")
        setConnection(conn ?? null)
      })
      .catch(() => { if (!cancelled) setConnection(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [providerKey])

  return { connection, loading }
}
