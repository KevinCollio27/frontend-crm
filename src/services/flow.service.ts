import api from "@/lib/api"
import type { Flow } from "@/types/flow"

export const flowService = {
  async all(): Promise<Flow[]> {
    const res = await api.get<never, { flows: Flow[] }>("flow/all")
    return res.flows
  },
}
