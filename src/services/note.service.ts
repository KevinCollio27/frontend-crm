import api from "@/lib/api"
import type { NoteRaw, NotePage } from "@/types/note"

export interface NoteListParams {
  person_id?: number
  organization_id?: number
  opportunity_id?: number
  opportunity_activity_id?: number
  page?: number
  take?: number
}

export interface NoteCreatePayload {
  title: string
  content: string
  organization_id?: number
  person_id?: number
  opportunity_id?: number
  opportunity_activity_id?: number
}

export const noteService = {
  async list(params: NoteListParams = {}): Promise<NotePage> {
    const res = await api.get<never, { data: NotePage }>("note", { params })
    return res.data
  },

  async create(data: NoteCreatePayload): Promise<NoteRaw> {
    const res = await api.post<never, { note: NoteRaw }>("note", data)
    return res.note
  },

  async update(id: number, data: Partial<NoteCreatePayload>): Promise<NoteRaw> {
    const res = await api.put<never, { note: NoteRaw }>(`note/${id}`, data)
    return res.note
  },

  async delete(id: number): Promise<void> {
    await api.delete(`note/${id}`)
  },
}
