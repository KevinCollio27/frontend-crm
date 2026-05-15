export interface CampaignUser {
  name: string
  email: string
}

export interface CampaignRaw {
  id: number
  workspace_id: number
  user_id: number
  name: string
  subject: string
  audience_filter: string
  status: string
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  sent_at: string | null
  created_at: string
  updated_at: string
  user: CampaignUser
}

export interface CampaignPage {
  data: CampaignRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}
