import api from "@/lib/api"
import type { SystemLogPage } from "@/types/system-log"

export interface SystemLogListParams {
  page?: number
  take?: number
  user_id?: number
  keyEntity?: string
  keyEntityId?: number
}

export const systemLogService = {
  async list(params: SystemLogListParams = {}): Promise<SystemLogPage> {
    const res = await api.get<never, { data: SystemLogPage }>("system-log", { params })
    return res.data
  },
}
