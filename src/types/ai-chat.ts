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

export interface EmailCampaignProgressBlock {
  type: "email_campaign_progress"
  data: {
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

export type AiChatBlock =
  | EmailCampaignPreviewBlock
  | EmailCampaignStatsBlock
  | EmailCampaignSeriesStatsBlock
  | EmailCampaignProgressBlock

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
