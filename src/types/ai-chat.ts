export interface AiConversationListItem {
  id: number
  title: string
  last_message_at: string
  last_message_preview: string
}

export interface AiConversationGrouped {
  today: AiConversationListItem[]
  yesterday: AiConversationListItem[]
  thisWeek: AiConversationListItem[]
  thisMonth: AiConversationListItem[]
  older: AiConversationListItem[]
}

// Bloques visuales que la IA adjunta a su respuesta (ej. vista previa de campaña).
// El texto del mensaje siempre trae una versión legible del mismo contenido.
export type AiChatBlockStatus = "pending" | "superseded" | "sent" | "cancelled"

export interface EmailCampaignPreviewBlock {
  type: "email_campaign_preview"
  status: AiChatBlockStatus
  toolName: "createEmailCampaign"
  data: {
    intro: string
    name: string
    subject: string
    preheader?: string
    html: string
    previewFor: string
    recipientCount: number
    recipients: string[]
    excluded?: string
    warnings?: string
    testSentTo?: string
    campaignId?: number
    batch?: EmailCampaignBatchInfo
  }
}

export interface EmailCampaignBatchInfo {
  index: number
  total: number
  seriesTotal: number
  plan: { index: number; size: number; sent: boolean }[]
}

export interface WhatsappCampaignPreviewBlock {
  type: "whatsapp_campaign_preview"
  status: AiChatBlockStatus
  toolName: "createWhatsappCampaign"
  data: {
    intro: string
    name: string
    templateName: string
    category: string | null
    body: string
    template: WhatsappTemplateView
    previewFor: string
    recipientCount: number
    recipients: string[]
    excluded?: string
    campaignId?: number
    alternatives: WhatsappTemplateView[]
    batch?: EmailCampaignBatchInfo
    testSentTo?: string
  }
}

export interface WhatsappTemplateView {
  name: string
  category: string | null
  variables: number
  headerMode: "none" | "text" | "image"
  headerText?: string
  headerImageUrl?: string
  body: string
  footerText?: string
  buttons: { text: string; url?: string }[]
}

export interface WhatsappTemplatePickerBlock {
  type: "whatsapp_template_picker"
  data: {
    templates: WhatsappTemplateView[]
    recommended?: string
  }
}

export interface EmailCampaignProgressBlock {
  type: "email_campaign_progress"
  data: {
    channel?: "email" | "whatsapp"
    campaignId: number
    name: string
    total: number
    batch?: { index: number; total: number; nextSize?: number }
  }
}

export type CampaignSegmentKey = "opened" | "clicked" | "not_opened" | "bounced"

export interface EmailCampaignStatsBlock {
  type: "email_campaign_stats"
  data: {
    id: number
    name: string
    subject: string
    status: string
    sentAt: string | null
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    spamReports: number
    deliveryRate: number
    openRate: number
    clickRate: number
    topLinks: { url: string; clicks: number }[]
    segments: Record<CampaignSegmentKey, { count: number; sample: string[] }>
    freshnessNote: string
    series?: { index: number; total: number; name: string }
  }
}

export interface CampaignSeriesBatch {
  id: number
  index: number
  status: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
}

export interface EmailCampaignSeriesStatsBlock {
  type: "email_campaign_series_stats"
  data: {
    name: string
    subject: string
    sentAt: string
    campaignIds: number[]
    batches: CampaignSeriesBatch[]
    totals: { sent: number; delivered: number; opened: number; clicked: number; bounced: number; deliveryRate: number; openRate: number; clickRate: number }
    followUps: { id: number; name: string; sentAt: string; sent: number; openRate: number; clickRate: number }[]
    segments: Record<"opened" | "clicked" | "not_opened" | "not_clicked", number>
    freshnessNote: string
  }
}

export type WhatsappSegmentKey = "read" | "not_read" | "replied" | "not_replied" | "failed"

export interface WhatsappCampaignStatsBlock {
  type: "whatsapp_campaign_stats"
  data: {
    id: number
    name: string
    templateName: string
    sentAt: string
    total: number
    sent: number
    delivered: number
    read: number
    replied: number
    failed: number
    deliveryRate: number
    readRate: number
    replyRate: number
    failureReasons: { reason: string; count: number }[]
    segments: Record<WhatsappSegmentKey, { count: number; sample: string[] }>
    freshnessNote: string
  }
}

export interface WhatsappCostBlock {
  type: "whatsapp_cost"
  data: {
    scope: "period" | "campaign"
    title: string
    subtitle?: string
    currency: string
    total: number
    estimated: boolean
    messages: number
    perMessage?: number
    rows: { label: string; count: number; cost: number }[]
    note: string
  }
}

export type AiChatBlock =
  | EmailCampaignPreviewBlock
  | EmailCampaignStatsBlock
  | EmailCampaignSeriesStatsBlock
  | EmailCampaignProgressBlock
  | WhatsappCampaignPreviewBlock
  | WhatsappTemplatePickerBlock
  | WhatsappCampaignStatsBlock
  | WhatsappCostBlock

export interface AiChatBlockUpdate {
  messageId: number
  status: AiChatBlockStatus
  campaignId?: number
}

export interface AiMessage {
  id: number
  conversation_id: number
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
  tokens_used?: number
  model_used?: string
  images?: string[]
  metadata?: { blocks?: AiChatBlock[] } | null
}

export interface AiConversationDetail {
  id: number
  title: string
  messages: AiMessage[]
}

export interface AiChatResponse {
  role: "assistant"
  content: string
  conversationId: number
  messageId?: number
  metadata?: {
    blocks?: AiChatBlock[]
    blockUpdates?: AiChatBlockUpdate[]
  }
}
