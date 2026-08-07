export interface MailInlineImage {
  contentId: string
  mimeType: string
  dataUri?: string // ya resuelto (parte chica, Gmail mandó los bytes de una)
  attachmentId?: string // hay que pedir los bytes aparte (GET .../attachments/:id)
}

export interface MailAttachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

export interface MailRecipient {
  name: string
  email: string
}

export interface Mail {
  id: string
  name: string
  email: string
  to: MailRecipient[]
  cc: MailRecipient[]
  subject: string
  text: string // texto plano — preview en la lista y búsqueda
  bodyHtml?: string // HTML sanitizado — si existe, se usa en el detalle en vez de `text`
  inlineImages: MailInlineImage[] // imágenes referenciadas como src="cid:xxx" en bodyHtml (firmas/logos)
  attachments: MailAttachment[] // adjuntos descargables (PDF, Excel, fotos como archivo)
  isGoxtSystem: boolean // firmado (DKIM) por el dominio de GOXT — CRM, Cargo, etc., más allá del nombre visible
  messageIdHeader?: string // header RFC "Message-ID" — hace falta para el In-Reply-To/References al responder
  isStarred: boolean
  date: string
  read: boolean
  labels: string[]
}

export interface MailThread {
  id: string
  subject: string
  messages: Mail[] // orden cronológico ascendente (más viejo primero, como Gmail)
  date: string // fecha del último mensaje — para ordenar/mostrar en la lista
  read: boolean // true si NINGÚN mensaje del thread está sin leer
}

// Versión liviana de un mensaje/thread — solo lo que necesita una fila de la lista (sin
// body/adjuntos/imágenes, que solo se piden al abrir el correo puntual).
export interface MailSummary {
  id: string
  name: string
  email: string
  subject: string
  text: string
  isGoxtSystem: boolean
  date: string
  read: boolean
}

export interface MailThreadSummary {
  id: string
  subject: string
  lastMessage: MailSummary
  messageCount: number
  date: string
  read: boolean
}

export type Folder =
  | "inbox"
  | "sent"
  | "junk"
  | "archive"
  | "trash"
