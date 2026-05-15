import api from "@/lib/api"
import type { DocumentPage } from "@/types/document"

export interface DocumentListParams {
  page?: number
  take?: number
  filter?: string
  category?: string
  visibility?: string
}

export const documentService = {
  async list(params: DocumentListParams = {}): Promise<DocumentPage> {
    const res = await api.get<never, { documents: DocumentPage }>("workspace-document", { params })
    return res.documents
  },
}
