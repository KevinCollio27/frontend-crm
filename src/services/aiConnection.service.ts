import api from "@/lib/api"
import type { AiConnection, CreateAiConnectionInput } from "@/types/ai-connection"

export const aiConnectionService = {
  async all(): Promise<AiConnection[]> {
    const res = await api.get<never, { connections: AiConnection[] }>("ai-connection")
    return res.connections
  },

  // La clave solo viene en esta respuesta: el backend guarda únicamente su hash.
  async create(input: CreateAiConnectionInput): Promise<{ id: number; key: string }> {
    return api.post<never, { id: number; key: string }>("ai-connection", input)
  },

  async revoke(id: number): Promise<void> {
    await api.delete(`ai-connection/${id}`)
  },
}
