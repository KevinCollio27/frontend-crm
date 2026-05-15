export interface DocumentUploader {
  id: number
  name: string
  email: string
}

export interface DocumentRaw {
  id: number
  workspace_id: number
  user_id: number
  name: string
  description: string | null
  file_path: string
  file_name: string
  file_type: string
  file_size: number | null
  category: string | null
  visibility: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  user: DocumentUploader
}

export interface DocumentPage {
  data: DocumentRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  count: number
  nextPage: number | null
  prevPage: number | null
}
