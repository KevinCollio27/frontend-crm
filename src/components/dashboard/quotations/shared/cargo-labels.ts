import { integrationService } from "@/services/integration.service"

export type CargoLabelType = "cargo_vessels" | "cargo_addresses" | "cargo_routes" | "cargo_geofences"

export interface CargoOption {
  id: number
  name: string
  displayLabel: string
  shipType?: string
}

const CARGO_KEYS: Record<CargoLabelType, { idKey: string; nameKey: string; shipTypeKey?: string }> = {
  cargo_vessels:   { idKey: "vessel_id",   nameKey: "vessel_name",   shipTypeKey: "vessel_ship_type" },
  cargo_addresses: { idKey: "address_id",  nameKey: "address_name" },
  cargo_routes:    { idKey: "route_id",    nameKey: "route_name" },
  cargo_geofences: { idKey: "geofence_id", nameKey: "geofence_name" },
}

export function isCargoLabelType(type: string): type is CargoLabelType {
  return type in CARGO_KEYS
}

// Trae la lista de opciones en vivo desde Cargo para el tipo pedido. El nombre real
// de cada recurso varía en la API de Cargo (naves/rutas/geocercas usan "name",
// direcciones usa "alias") — normalizado acá a {id, name, displayLabel}.
export async function fetchCargoOptions(type: CargoLabelType): Promise<CargoOption[]> {
  switch (type) {
    case "cargo_vessels": {
      const vessels = await integrationService.getCargoVessels()
      return vessels.map((v) => ({
        id: v.id,
        name: v.name,
        shipType: v.ship_type ?? undefined,
        displayLabel: v.ship_type ? `${v.name} (${v.ship_type})` : v.name,
      }))
    }
    case "cargo_addresses": {
      const addresses = await integrationService.getCargoAddresses()
      return addresses.map((a) => ({
        id: a.id,
        name: a.alias || a.full_address,
        displayLabel: a.alias || a.full_address,
      }))
    }
    case "cargo_routes": {
      const routes = await integrationService.getCargoRoutes()
      return routes.map((r) => ({
        id: r.id,
        name: r.name,
        displayLabel: r.origin && r.destination ? `${r.name} (${r.origin} → ${r.destination})` : r.name,
      }))
    }
    case "cargo_geofences": {
      const geofences = await integrationService.getCargoGeofences()
      return geofences.map((g) => ({ id: g.id, name: g.name, displayLabel: g.name }))
    }
  }
}

// El valor guardado en la fila de servicio es un JSON string con llaves prefijadas
// por tipo (ej. vessel_id/vessel_name) — mismo shape que ya lee QuotationPDF.tsx.
export function parseCargoValue(value: string, type: CargoLabelType): { id: string; name: string } | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    const { idKey, nameKey } = CARGO_KEYS[type]
    if (parsed?.[idKey] == null) return null
    return { id: String(parsed[idKey]), name: parsed[nameKey] ?? "" }
  } catch {
    return null
  }
}

export function buildCargoValue(option: CargoOption, type: CargoLabelType): string {
  const { idKey, nameKey, shipTypeKey } = CARGO_KEYS[type]
  const payload: Record<string, unknown> = { [idKey]: option.id, [nameKey]: option.name }
  if (shipTypeKey && option.shipType) payload[shipTypeKey] = option.shipType
  return JSON.stringify(payload)
}
