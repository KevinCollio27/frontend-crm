import api from "@/lib/api"
import type { FileOpportunityPage, FileOpportunityRaw } from "@/types/file-opportunity"

export const fileOpportunityService = {
  async list(opportunityId: number, page = 1, take = 50): Promise<FileOpportunityPage> {
    const res = await api.get<never, { fileOpportunities: FileOpportunityPage }>(
      "file-opportunity",
      { params: { opportunityId, page, take } }
    )
    return res.fileOpportunities
  },

  async getUrl(id: number): Promise<string> {
    const res = await api.post<never, { url: string }>("file-opportunity/url", { id })
    return res.url
  },

  async create(payload: {
    opportunity_id: number
    name: string
    extension: string
    base64File: string
  }): Promise<FileOpportunityRaw> {
    const res = await api.post<never, { fileOpportunity: FileOpportunityRaw }>(
      "file-opportunity",
      payload
    )
    return res.fileOpportunity
  },

  async update(id: number, payload: {
    name: string
    extension?: string
    base64File?: string
  }): Promise<FileOpportunityRaw> {
    const res = await api.patch<never, { fileOpportunity: FileOpportunityRaw }>(
      `file-opportunity/${id}`,
      payload
    )
    return res.fileOpportunity
  },

  async delete(id: number): Promise<void> {
    await api.delete(`file-opportunity/${id}`)
  },
}
