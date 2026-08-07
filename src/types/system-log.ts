export interface SystemLogRaw {
  id: number
  userId: number | null
  userName: string | null
  message: string
  keyEntity: string
  keyAction: string
  keyEntityId: number | null
  createdAt: string
}

export interface SystemLogPage {
  data: SystemLogRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  nextPage: number | null
  prevPage: number | null
}
