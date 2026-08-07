export interface NoteRaw {
  id: number
  title: string
  content: string
  person_id: number | null
  organization_id: number | null
  opportunity_id: number | null
  opportunity_activity_id: number | null
  person_interest_id: number | null
  created_at: string
  updated_at: string
  person: { id: number; name: string } | null
  organization: { id: number; name: string } | null
  opportunity: { id: number; name: string } | null
  opportunity_activity: { id: number; title: string | null } | null
  person_interest: { id: number; description: string } | null
}

export interface NotePage {
  data: NoteRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  count: number
  nextPage: number | null
  prevPage: number | null
}
