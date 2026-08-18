export interface UnreadConversationNotificationRaw {
  channel: "whatsapp" | "widget"
  conversationId: number
  widgetId?: number
  visitorName: string
  lastMessage: string
  unreadCount: number
  lastActivityAt: string
  messages: { content: string; createdAt: string }[]
}
