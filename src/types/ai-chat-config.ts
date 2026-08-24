export interface AiChatConfigDocument {
  id: number
  name: string
  fileType: string
  category: string | null
  visibility: "public" | "private"
}

export interface AiChatConfig {
  instructions: string
  documents: AiChatConfigDocument[]
}
