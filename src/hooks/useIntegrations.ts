import * as React from "react"
import { integrationService } from "@/services/integration.service"
import type { IntegrationProviderRaw, WorkspaceIntegrationRaw } from "@/types/integration"

export function useIntegrations() {
  const [providers, setProviders] = React.useState<IntegrationProviderRaw[]>([])
  const [connections, setConnections] = React.useState<WorkspaceIntegrationRaw[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([integrationService.getProviders(), integrationService.getWorkspaceIntegrations()])
      .then(([providersRes, connectionsRes]) => {
        if (cancelled) return
        setProviders(providersRes)
        setConnections(connectionsRes)
      })
      .catch(() => {
        if (!cancelled) { setProviders([]); setConnections([]) }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [refreshKey])

  return {
    providers,
    connections,
    loading,
    refresh: () => setRefreshKey((k) => k + 1),
  }
}
