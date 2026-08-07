export interface InstagramConfigRaw {
  id: number
  ig_business_account_id: string
  ig_username: string | null
  page_id: string
  page_name: string | null
  profile_picture_url: string | null
  agent_id: number | null
  is_active: boolean
  updated_at: string
  meta_live: boolean
}

export interface InstagramPageOptionRaw {
  page_id: string
  page_name: string
  ig_business_account_id: string
  page_access_token: string
}

export interface InstagramSignupResult {
  requires_selection: boolean
  page_id?: string
  ig_business_account_id?: string
  ig_username?: string
  pages: InstagramPageOptionRaw[]
}
