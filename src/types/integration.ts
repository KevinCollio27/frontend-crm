export interface IntegrationProviderRaw {
  id: number
  name: string
  key: string
  description: string | null
  icon_url: string | null
  is_active: boolean
  config: Record<string, unknown> | null
}

export type GoogleAttendeeStatus = "accepted" | "declined" | "tentative" | "needsAction"

export interface GoogleAttendeeRaw {
  email: string
  responseStatus: GoogleAttendeeStatus
  organizer?: boolean
  self?: boolean
}

export interface GoogleCalendarEventRaw {
  id: string
  title: string
  description?: string
  start: string
  end: string
  location?: string
  attendees: GoogleAttendeeRaw[]
  htmlLink: string
  meetLink?: string
  status: string
}

export interface GmailInlineImageRaw {
  contentId: string
  mimeType: string
  dataUri?: string
  attachmentId?: string
}

export interface GmailAttachmentRaw {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

export interface GmailRecipientRaw {
  name: string
  email: string
}

export interface GmailMessageRaw {
  id: string
  threadId: string
  subject: string
  fromName: string
  fromEmail: string
  to: GmailRecipientRaw[]
  cc: GmailRecipientRaw[]
  snippet: string
  date: string
  isUnread: boolean
  isStarred: boolean
  bodyText?: string
  bodyHtml?: string
  inlineImages: GmailInlineImageRaw[]
  attachments: GmailAttachmentRaw[]
  signedBy?: string
  messageIdHeader?: string
}

export interface GmailThreadRaw {
  id: string
  subject: string
  messages: GmailMessageRaw[] // orden cronológico ascendente
  lastDate: string
  isUnread: boolean
}

export interface GmailMessageSummaryRaw {
  id: string
  fromName: string
  fromEmail: string
  subject: string
  snippet: string
  date: string
  isUnread: boolean
  signedBy?: string
}

export interface GmailThreadSummaryRaw {
  id: string
  subject: string
  lastMessage: GmailMessageSummaryRaw
  messageCount: number
  lastDate: string
  isUnread: boolean
}

export interface GmailThreadListPageRaw {
  threads: GmailThreadSummaryRaw[]
  nextPageToken?: string
  resultSizeEstimate?: number
}

export interface WorkspaceIntegrationRaw {
  id: number
  provider_key: string
  provider_name: string
  account_name: string | null
  account_email: string | null
  is_active: boolean
  sync_status: string
  last_sync_at: string | null
  created_at: string
  connected_by: "me" | "other"
}

export interface CargoVesselRaw {
  id: number
  name: string
  ship_type: string | null
  is_active: boolean
  status?: string
  call_sign?: string | null
  registration_number?: string | null
}

export interface CargoAddressRaw {
  id: number
  alias: string
  address: string
  full_address: string
  lat: number | null
  lng: number | null
  reference: string | null
  is_active: boolean
}

export interface CargoRouteRaw {
  id: number
  name: string
  description: string | null
  origin: string
  destination: string
  origin_address_id: number | null
  destination_address_id: number | null
  is_active: boolean
}

export interface CargoGeofenceRaw {
  id: number
  name: string
  description: string | null
  shape: string
  is_active: boolean
}
