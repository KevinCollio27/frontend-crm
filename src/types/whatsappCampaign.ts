export interface WhatsappCampaignRecipientRaw {
  id: number
  campaign_id: number
  person_id: number | null
  name: string | null
  phone_number: string
  status: "pending" | "sent" | "delivered" | "read" | "failed"
  wamid: string | null
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
}

export interface WhatsappCampaignRaw {
  id: number
  workspace_id: number
  user_id: number
  name: string
  template_name: string
  template_language: string
  body_text: string | null
  audience_filter: "crm" | "custom_list"
  custom_recipients: { name: string; phone: string }[] | null
  status: "draft" | "processing" | "sent" | "partial" | "failed"
  total_count: number
  sent_count: number
  delivered_count: number
  read_count: number
  failed_count: number
  sent_at: string | null
  created_at: string
  recipients?: WhatsappCampaignRecipientRaw[]
}

export interface DispatchWhatsappCampaignPayload {
  name: string
  templateName: string
  templateLanguage: string
  bodyText: string
  audienceFilter: "crm" | "custom_list"
  personIds?: number[]
  customRecipients?: { name: string; phone: string }[]
  variableValues?: string[]
}
