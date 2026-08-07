import { useIntegrations } from "./useIntegrations"

// Gateo reutilizable para cualquier feature que dependa de si el workspace
// tiene la integración de Cargo conectada y activa (ej. mostrar las etiquetas
// cargo_* al crear un producto, o el selector en vivo al armar una cotización).
export function useCargoIntegration() {
  const { connections, loading } = useIntegrations()
  const cargoIntegration = connections.find((c) => c.provider_key === "cargo" && c.is_active)

  return {
    hasCargoIntegration: !!cargoIntegration,
    cargoIntegration: cargoIntegration ?? null,
    loading,
  }
}
