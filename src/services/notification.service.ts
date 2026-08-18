import api from "@/lib/api"
import type { UnreadConversationNotificationRaw } from "@/types/notification"

export const notificationService = {
  async getUnreadConversations(): Promise<UnreadConversationNotificationRaw[]> {
    const res = await api.get<never, { conversations: UnreadConversationNotificationRaw[] }>(
      "notifications/unread-conversations",
    )
    return res.conversations
  },

  async markWidgetConversationRead(widgetId: number, conversationId: number): Promise<void> {
    await api.patch(`ai/widgets/${widgetId}/conversations/${conversationId}/read`, {})
  },
}
