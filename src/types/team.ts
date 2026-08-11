export interface InvitationRaw {
  id: number
  email: string
  is_accepted: boolean
  is_expired: boolean
  expire_at: string
  created_at: string
}

export interface InvitationPage {
  data: InvitationRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

export interface TeamMemberRaw {
  id: number
  user_id: number
  is_active: boolean
  is_admin: boolean
  is_owner: boolean
  whatsapp_number: string | null
  whatsapp_enabled: boolean
  created_at: string
  user: {
    id: number
    name: string
    email: string
    avatar_url: string | null
  }
}

export interface TeamPage {
  data: TeamMemberRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

export interface InviteLinkRaw {
  code: string
  is_active: boolean
  workspace_id: number
}
