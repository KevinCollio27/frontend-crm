import api from "@/lib/api"
import type { AiChatConfig } from "@/types/ai-chat-config"

export const aiChatConfigService = {
  async get(): Promise<AiChatConfig> {
    const res = await api.get<never, AiChatConfig>("ai/chat-config")
    return res
  },

  async update(payload: { instructions: string; documentIds: number[] }): Promise<AiChatConfig> {
    const res = await api.put<never, AiChatConfig>("ai/chat-config", payload)
    return res
  },
}
