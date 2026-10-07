export type AiAssistant = "claude" | "chatgpt" | "gemini" | "other"

export type AiConnectionScope = "read" | "crm"

export interface AiConnection {
  id: number
  name: string
  assistant: AiAssistant
  key_prefix: string
  scopes: AiConnectionScope[]
  last_used_at: string | null
  created_at: string
}

export interface CreateAiConnectionInput {
  name: string
  assistant: AiAssistant
  can_write: boolean
}
