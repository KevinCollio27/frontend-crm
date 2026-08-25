import api from "@/lib/api"
import type { CargoAddressRaw, CargoGeofenceRaw, CargoRouteRaw, CargoVesselRaw, GmailThreadListPageRaw, GmailThreadRaw, GoogleCalendarEventRaw, IntegrationProviderRaw, WorkspaceIntegrationRaw } from "@/types/integration"
import type { GoogleContactRaw } from "@/types/google-contacts"

export interface TestConnectionResult {
  ok: boolean
  message: string
}

export const integrationService = {
  async getProviders(): Promise<IntegrationProviderRaw[]> {
    const res = await api.get<never, { data: IntegrationProviderRaw[] }>("integration/providers")
    return res.data
  },

  async getWorkspaceIntegrations(): Promise<WorkspaceIntegrationRaw[]> {
    const res = await api.get<never, { data: WorkspaceIntegrationRaw[] }>("integration/workspace")
    return res.data
  },

  async disconnect(integrationId: number): Promise<void> {
    await api.delete(`integration/disconnect/${integrationId}`)
  },

  async getGoogleCalendarAuthUrl(): Promise<string> {
    const res = await api.get<never, { data: { auth_url: string } }>("integration/google-calendar/auth")
    return res.data.auth_url
  },

  async getGmailAuthUrl(): Promise<string> {
    const res = await api.get<never, { data: { auth_url: string } }>("integration/gmail/auth")
    return res.data.auth_url
  },

  async getGoogleContactsAuthUrl(): Promise<string> {
    const res = await api.get<never, { data: { auth_url: string } }>("integration/google-contacts/auth")
    return res.data.auth_url
  },

  async getGoogleContactsList(integrationId: number): Promise<GoogleContactRaw[]> {
    const res = await api.get<never, { data: GoogleContactRaw[] }>(`integration/google-contacts/${integrationId}/contacts`)
    return res.data
  },

  async getGmailThreads(
    integrationId: number,
    params: { labelId: string; maxResults?: number; pageToken?: string; q?: string }
  ): Promise<GmailThreadListPageRaw> {
    const res = await api.get<never, { data: GmailThreadListPageRaw }>(
      `integration/gmail/${integrationId}/threads`,
      { params }
    )
    return res.data
  },

  async getGmailThread(integrationId: number, threadId: string): Promise<GmailThreadRaw> {
    const res = await api.get<never, { data: { thread: GmailThreadRaw } }>(
      `integration/gmail/${integrationId}/threads/${threadId}`
    )
    return res.data.thread
  },

  async getGmailAttachment(integrationId: number, messageId: string, attachmentId: string): Promise<{ data: string }> {
    const res = await api.get<never, { data: { data: string } }>(
      `integration/gmail/${integrationId}/messages/${messageId}/attachments/${attachmentId}`
    )
    return res.data
  },

  async sendGmailMessage(
    integrationId: number,
    params: {
      to: string
      cc?: string
      bcc?: string
      subject: string
      body: string
      signatureHtml?: string
      attachments?: { filename: string; mimeType: string; data: string }[]
      threadId?: string
      inReplyTo?: string
      opportunityId?: number
    }
  ): Promise<{ id: string; threadId: string }> {
    const res = await api.post<never, { data: { id: string; threadId: string } }>(
      `integration/gmail/${integrationId}/send`,
      params
    )
    return res.data
  },

  async markGmailThreadRead(integrationId: number, threadId: string): Promise<void> {
    await api.post(`integration/gmail/${integrationId}/threads/${threadId}/read`, {})
  },

  async toggleGmailStar(integrationId: number, messageId: string, starred: boolean): Promise<void> {
    await api.post(`integration/gmail/${integrationId}/messages/${messageId}/star`, { starred })
  },

  async sendGmailReaction(
    integrationId: number,
    params: { to: string; cc?: string; subject: string; threadId: string; inReplyTo: string; emoji: string }
  ): Promise<void> {
    await api.post(`integration/gmail/${integrationId}/react`, params)
  },

  async getGmailSignature(integrationId: number): Promise<string | undefined> {
    const res = await api.get<never, { data: { signature?: string } }>(
      `integration/gmail/${integrationId}/signature`
    )
    return res.data.signature
  },

  async getGoogleCalendarEvents(integrationId: number, params: { timeMin: string; timeMax: string }): Promise<GoogleCalendarEventRaw[]> {
    const res = await api.get<never, { data: { events: GoogleCalendarEventRaw[] } }>(
      `integration/google-calendar/${integrationId}/events`,
      { params }
    )
    return res.data.events
  },

  async createGoogleCalendarEvent(params: {
    summary: string
    description?: string
    startDateTime: string
    endDateTime: string
    attendees?: string[]
    activityId?: number
    workspaceIntegrationId: number
    createConference?: boolean
  }): Promise<{ id: number; googleEventId: string; eventUrl: string; meetUrl?: string }> {
    const res = await api.post<never, { data: { id: number; googleEventId: string; eventUrl: string; meetUrl?: string } }>(
      "integration/google-calendar/create-event",
      params
    )
    return res.data
  },

  async updateGoogleCalendarEvent(integrationId: number, eventId: string, params: {
    summary: string
    description?: string
    startDateTime: string
    endDateTime: string
    attendees?: string[]
  }): Promise<{ id: string; eventUrl: string }> {
    const res = await api.put<never, { data: { id: string; eventUrl: string } }>(
      `integration/google-calendar/${integrationId}/event/${eventId}`,
      params
    )
    return res.data
  },

  async deleteGoogleCalendarEvent(integrationId: number, eventId: string): Promise<void> {
    await api.delete(`integration/google-calendar/${integrationId}/event/${eventId}`)
  },

  async connectAiSuggestions(): Promise<void> {
    await api.post("integration/connect/ai-suggestions", {})
  },

  async connectCargo(params: { apiUrl: string; workspaceToken: string; accountName?: string }): Promise<WorkspaceIntegrationRaw> {
    const res = await api.post<never, { data: WorkspaceIntegrationRaw }>("integration/connect/cargo", {
      api_url: params.apiUrl,
      workspace_token: params.workspaceToken,
      account_name: params.accountName,
    })
    return res.data
  },

  // El backend responde HTTP 400 si la conexión falla — se normaliza acá a un resultado
  // que no rechaza, para que el botón "Probar conexión" no necesite try/catch.
  async testCargoConnection(params: { apiUrl: string; workspaceToken: string }): Promise<TestConnectionResult> {
    try {
      const res = await api.post<never, { message: string }>("integration/cargo/test-connection", {
        api_url: params.apiUrl,
        workspace_token: params.workspaceToken,
      })
      return { ok: true, message: res.message }
    } catch (error) {
      return { ok: false, message: (error as { message?: string })?.message ?? "No se pudo conectar." }
    }
  },

  // El proxy CRM reenvía tal cual la respuesta de Cargo ({success, data, message, total}),
  // por eso hay doble ".data" acá: uno del wrapper del backend CRM, otro del de Cargo.
  async getCargoVessels(): Promise<CargoVesselRaw[]> {
    const res = await api.get<never, { data: { data: CargoVesselRaw[] } }>("integration/cargo/vessels")
    return res.data.data
  },

  async getCargoAddresses(): Promise<CargoAddressRaw[]> {
    const res = await api.get<never, { data: { data: CargoAddressRaw[] } }>("integration/cargo/addresses")
    return res.data.data
  },

  async getCargoRoutes(): Promise<CargoRouteRaw[]> {
    const res = await api.get<never, { data: { data: CargoRouteRaw[] } }>("integration/cargo/routes")
    return res.data.data
  },

  async getCargoGeofences(): Promise<CargoGeofenceRaw[]> {
    const res = await api.get<never, { data: { data: CargoGeofenceRaw[] } }>("integration/cargo/geofences")
    return res.data.data
  },

  // El backend valida que no se haya enviado antes (via quotation_history) — si ya fue
  // enviada, responde 400 y el error se propaga tal cual para mostrarse al usuario.
  async sendQuotationToCargo(params: {
    integrationId: number
    quotationId: number
    productId?: number
    productName?: string
    sku?: string
  }): Promise<{ quotation_name: string; quotation_total: number }> {
    const res = await api.post<never, { data: { quotation_name: string; quotation_total: number } }>(
      "integration/cargo/send-quotation",
      {
        integrationId: params.integrationId,
        quotationId: params.quotationId,
        productId: params.productId,
        productName: params.productName,
        sku: params.sku,
      }
    )
    return res.data
  },
}
