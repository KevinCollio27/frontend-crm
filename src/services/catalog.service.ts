import api from "@/lib/api"
import type { CatalogOption, LabelOptionsRaw, LabelPage } from "@/types/catalog"

interface CreatedOptionRaw {
  id: number
  value: string
  order_number: number | null
  is_active: boolean
}

// ─── Label options cache ───────────────────────────────────────────────────────
// Las opciones de catálogo no cambian durante una sesión.
// Caché en memoria con TTL de 5 minutos + single-flight para evitar requests
// duplicados cuando múltiples componentes piden el mismo key simultáneamente.

const labelCache   = new Map<string, { data: LabelOptionsRaw[]; expiresAt: number }>()
const labelInFlight = new Map<string, Promise<LabelOptionsRaw[]>>()
const LABEL_CACHE_TTL_MS = 5 * 60 * 1000

async function fetchLabelOptions(keys: string): Promise<LabelOptionsRaw[]> {
  const now = Date.now()

  // Cache hit
  const cached = labelCache.get(keys)
  if (cached && now < cached.expiresAt) return cached.data

  // Ya hay un request en vuelo para este key — comparte el mismo Promise
  const inflight = labelInFlight.get(keys)
  if (inflight) return inflight

  // Primer request: lanza la query y registra el Promise
  const promise = api
    .get<never, { labels: LabelOptionsRaw[] }>("label/options", { params: { key: keys } })
    .then((res) => {
      labelCache.set(keys, { data: res.labels, expiresAt: Date.now() + LABEL_CACHE_TTL_MS })
      labelInFlight.delete(keys)
      return res.labels
    })
    .catch((err) => {
      labelInFlight.delete(keys)
      throw err
    })

  labelInFlight.set(keys, promise)
  return promise
}

// Se llama tras cualquier mutación de opciones — evita que el resto del CRM
// (selectores de email/teléfono/etiqueta, etc.) siga sirviendo datos cacheados vencidos.
function invalidateLabelCache() {
  labelCache.clear()
  labelInFlight.clear()
}

export const catalogService = {
  async list(): Promise<LabelPage> {
    const res = await api.get<never, { labels: LabelPage }>("label", {
      params: { take: 100 },
    })
    return res.labels
  },

  async getLabelOptions(key: string | string[]): Promise<LabelOptionsRaw[]> {
    const keys = Array.isArray(key) ? key.join(",") : key
    return fetchLabelOptions(keys)
  },

  async createOption(params: { value: string; labelId: number; orderNumber: number }): Promise<CreatedOptionRaw> {
    const res = await api.post<never, { data: CreatedOptionRaw }>("label/option", {
      value: params.value,
      label_id: params.labelId,
      order_number: params.orderNumber,
    })
    invalidateLabelCache()
    return res.data
  },

  async updateOption(params: { id: number; value?: string; labelId: number; orderNumber?: number; isActive?: boolean }): Promise<void> {
    await api.put("label/option", {
      id: params.id,
      value: params.value,
      label_id: params.labelId,
      order_number: params.orderNumber,
      is_active: params.isActive,
    })
    invalidateLabelCache()
  },

  async deleteOption(optionId: number): Promise<void> {
    await api.delete("label/option", { data: { optionId } })
    invalidateLabelCache()
  },

  async reorderOptions(options: { id: number; orderNumber: number }[]): Promise<void> {
    await api.post(
      "label/option/update-many",
      options.map((o) => ({ id: o.id, order_number: o.orderNumber }))
    )
    invalidateLabelCache()
  },
}

// Filtra las opciones activas y las ordena por order_number (nulls al final).
export function activeOptions(label: LabelOptionsRaw): CatalogOption[] {
  return label.options
    .filter((o) => o.option_status.length === 0 || o.option_status[0].is_active)
    .sort((a, b) => {
      if (a.order_number === null) return 1
      if (b.order_number === null) return -1
      return a.order_number - b.order_number
    })
    .map((o) => ({ id: o.id, value: o.value }))
}
