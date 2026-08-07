import type { EntityRaw, SimpleLabelInfo, WidgetDetailPayload, WidgetFlow } from "@/types/public-widget"

async function widgetFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/widget-proxy/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "x-access-token": token, ...options.headers },
  })
  const data = await res.json()
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "No se pudo completar la solicitud.")
  }
  return data
}

export const publicWidgetService = {
  async getFlows(token: string): Promise<WidgetFlow[]> {
    const data = await widgetFetch<{ flows: WidgetFlow[] }>("widget/flow/all", token)
    return data.flows
  },

  async getPersonLabels(token: string): Promise<EntityRaw[]> {
    const data = await widgetFetch<{ labels: EntityRaw[] }>("label/widget/key?key=person", token)
    return data.labels
  },

  async createOrganization(
    token: string,
    payload: { name: string; document_number: string; web_page?: string | null; industry?: string | null; turnstileToken?: string }
  ): Promise<{ id: number }> {
    const data = await widgetFetch<{ organization: { id: number } }>("widget/organization", token, {
      method: "POST",
      body: JSON.stringify({ ...payload, address: [], tag: [], origin: "widget" }),
    })
    return data.organization
  },

  async createPerson(
    token: string,
    payload: {
      name: string
      organization_id: number
      email: WidgetDetailPayload[]
      phone: WidgetDetailPayload[]
    }
  ): Promise<{ id: number }> {
    const data = await widgetFetch<{ person: { id: number } }>("widget/person", token, {
      method: "POST",
      body: JSON.stringify({ ...payload, charge: [], tag: [], origin: "widget" }),
    })
    return data.person
  },

  async createOpportunity(
    token: string,
    payload: {
      flow_id: number
      flow_stage_id: number
      person_id: number
      organization_id: number
      name: string
      notes?: string
    }
  ): Promise<{ id: number }> {
    const data = await widgetFetch<{ opportunity: { id: number } }>("widget/opportunity/widget", token, {
      method: "POST",
      body: JSON.stringify({ ...payload, origin: "widget" }),
    })
    return data.opportunity
  },
}

// Aplana entity_label → busca el sub-label puntual (ej. "email" dentro de la
// entidad "person") y toma su primera opción activa como default — algunos
// workspaces no tienen ninguna opción seedeada, en ese caso queda "" (el
// backend igual acepta option vacío).
export function findSimpleLabel(entities: EntityRaw[], key: string): SimpleLabelInfo | undefined {
  for (const entity of entities) {
    for (const item of entity.entity_label) {
      if (item.label.key !== key) continue
      const active = item.label.options
        .filter((o) => o.option_status.length === 0 || o.option_status[0].is_active)
        .sort((a, b) => (a.order_number ?? Infinity) - (b.order_number ?? Infinity))
      return { labelId: item.label.id, defaultOption: active[0]?.value ?? "" }
    }
  }
  return undefined
}
