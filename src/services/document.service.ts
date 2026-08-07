import api from "@/lib/api"
import type { DocumentPage, DocumentRaw } from "@/types/document"

export interface DocumentListParams {
  page?: number
  take?: number
  filter?: string
  category?: string
  visibility?: string
}

export interface DocumentCreateFilePayload {
  name: string
  description?: string
  category?: string
  visibility: "public" | "private"
  isExternal: false
  extension: string
  fileSize: number
  base64File: string
}

export interface DocumentCreateUrlPayload {
  name: string
  description?: string
  category?: string
  visibility: "public" | "private"
  isExternal: true
  externalUrl: string
  extension: "link"
  fileSize: 0
}

export const documentService = {
  async list(params: DocumentListParams = {}): Promise<DocumentPage> {
    const res = await api.get<never, { documents: DocumentPage }>("workspace-document", { params })
    return res.documents
  },

  async create(payload: DocumentCreateFilePayload | DocumentCreateUrlPayload): Promise<DocumentRaw> {
    const res = await api.post<never, { document: DocumentRaw }>("workspace-document", payload)
    return res.document
  },

  async getUrl(id: number): Promise<string> {
    const res = await api.post<never, { url: string }>("workspace-document/url", { id })
    return res.url
  },

  async update(id: number, payload: {
    name: string
    description?: string | null
    category?: string | null
    visibility: "public" | "private"
  }): Promise<DocumentRaw> {
    const res = await api.put<never, { document: DocumentRaw }>(`workspace-document/${id}`, payload)
    return res.document
  },

  async delete(id: number): Promise<void> {
    await api.delete(`workspace-document/${id}`)
  },
}
