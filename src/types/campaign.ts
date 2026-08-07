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
  content: string | null
  blocks_json: unknown[] | null
  audience_filter: string
  custom_recipients: { name: string; email: string }[] | null
  status: string
  total_count: number
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
  dailyUsage: { used: number; limit: number }
}
