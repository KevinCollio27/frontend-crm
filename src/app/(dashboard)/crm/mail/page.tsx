"use client"

import * as React from "react"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import DOMPurify from "dompurify"
import { MailIcon, Loader2Icon, PencilLineIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ComposeDialog } from "@/components/dashboard/mail/ComposeDialog"
import { MailNav } from "@/components/dashboard/mail/MailNav"
import { MailList } from "@/components/dashboard/mail/MailList"
import { MailDisplay } from "@/components/dashboard/mail/MailDisplay"
import type { Folder, Mail, MailSummary, MailThread, MailThreadSummary } from "@/components/dashboard/mail/data"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { stripHtml } from "@/lib/utils"
import { integrationService } from "@/services/integration.service"
import type {
  GmailMessageRaw,
  GmailMessageSummaryRaw,
  GmailThreadRaw,
  GmailThreadSummaryRaw,
} from "@/types/integration"

// Carpetas con label directo en Gmail — Borradores (recurso aparte en la API de Gmail)
// queda fuera de este primer slice (solo lectura). "archive" no tiene label real en Gmail
// (es "sin INBOX/SENT/TRASH/SPAM"), el backend lo resuelve con una búsqueda en vez de labelIds.
const FOLDER_TO_LABEL: Partial<Record<Folder, string>> = {
  inbox: "INBOX",
  sent: "SENT",
  junk: "SPAM",
  trash: "TRASH",
  archive: "ARCHIVE",
}

const VALID_FOLDERS = new Set<Folder>(["inbox", "sent", "junk", "archive", "trash"])
const PAGE_SIZE = 10

// Todos los sistemas propios de GOXT (CRM, Cargo, etc.) firman DKIM con el mismo dominio,
// aunque el nombre de remitente visible cambie ("GOXT CRM" vs "GOXT CARGO"). Se usa para el
// badge visual; el filtro GOXT en sí (que sí pagina contra la API) usa from:goxt.io porque
// Gmail no tiene un operador de búsqueda para "firmado por".
const GOXT_SIGNING_DOMAIN = "goxt.io"

// Este archivo se evalúa también en el servidor (SSR de un componente "use client"),
// donde DOMPurify no tiene un DOM real y su export no expone addHook — se registra
// el hook solo en el browser, una vez por carga del módulo.
if (typeof window !== "undefined") {
  // Los links de un correo no deben navegar dentro del CRM — se abren en pestaña nueva.
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank")
      node.setAttribute("rel", "noopener noreferrer")
    }
  })
}

function sanitizeEmailHtml(html?: string): string | undefined {
  if (!html) return undefined
  // El cuerpo se renderiza en un <iframe> aislado (ver MailDisplay), no en el DOM de la
  // página — por eso acá SÍ se puede permitir <style> sin miedo a que se filtre y rompa
  // el resto del CRM. WHOLE_DOCUMENT preserva <head>/<style> cuando el correo trae un
  // documento completo (no solo el fragmento del <body>). <link> se sigue prohibiendo:
  // cargar una hoja de estilos externa no aporta nada acá y sí puede filtrar referrer.
  return DOMPurify.sanitize(html, { WHOLE_DOCUMENT: true, FORBID_TAGS: ["link"] })
}

function mapGmailMessage(raw: GmailMessageRaw): Mail {
  return {
    id: raw.id,
    name: raw.fromName,
    email: raw.fromEmail,
    to: raw.to,
    cc: raw.cc,
    subject: raw.subject,
    text: raw.bodyText || stripHtml(raw.bodyHtml) || raw.snippet,
    bodyHtml: sanitizeEmailHtml(raw.bodyHtml),
    inlineImages: raw.inlineImages,
    attachments: raw.attachments,
    isGoxtSystem: raw.signedBy?.toLowerCase() === GOXT_SIGNING_DOMAIN,
    messageIdHeader: raw.messageIdHeader,
    isStarred: raw.isStarred,
    date: raw.date,
    read: !raw.isUnread,
    labels: [],
  }
}

function mapGmailThread(raw: GmailThreadRaw): MailThread {
  return {
    id: raw.id,
    subject: raw.subject,
    messages: raw.messages.map(mapGmailMessage),
    date: raw.lastDate,
    read: !raw.isUnread,
  }
}

function mapGmailMessageSummary(raw: GmailMessageSummaryRaw): MailSummary {
  return {
    id: raw.id,
    name: raw.fromName,
    email: raw.fromEmail,
    subject: raw.subject,
    text: raw.snippet,
    isGoxtSystem: raw.signedBy?.toLowerCase() === GOXT_SIGNING_DOMAIN,
    date: raw.date,
    read: !raw.isUnread,
  }
}

function mapGmailThreadSummary(raw: GmailThreadSummaryRaw): MailThreadSummary {
  return {
    id: raw.id,
    subject: raw.subject,
    lastMessage: mapGmailMessageSummary(raw.lastMessage),
    messageCount: raw.messageCount,
    date: raw.lastDate,
    read: !raw.isUnread,
  }
}

function MailPageContent() {
  const { setOpen } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // La carpeta, el correo abierto y el filtro GOXT viven en la URL, no en useState — así un
  // F5 (o compartir el link) vuelve exactamente a donde estabas, en vez de resetear siempre.
  const folderParam = searchParams.get("folder")
  const activeFolder: Folder = folderParam && VALID_FOLDERS.has(folderParam as Folder) ? (folderParam as Folder) : "inbox"
  const selectedThreadId = searchParams.get("thread")
  const goxtOnly = searchParams.get("goxt") === "1"

  const [gmailConnectionId, setGmailConnectionId] = React.useState<number | null | undefined>(undefined)
  const [gmailAccountEmail, setGmailAccountEmail] = React.useState<string | null>(null)

  const [threads, setThreads] = React.useState<MailThreadSummary[]>([])
  const [listLoading, setListLoading] = React.useState(false)
  const [nextPageToken, setNextPageToken] = React.useState<string | undefined>(undefined)
  const [resultSizeEstimate, setResultSizeEstimate] = React.useState<number | undefined>(undefined)
  // Pila de pageToken ya visitados — Gmail solo da un token "hacia adelante", así que
  // "Anterior" se resuelve retrocediendo en esta pila en vez de pedirle uno a la API.
  const [pageTokens, setPageTokens] = React.useState<(string | undefined)[]>([undefined])
  const [pageIndex, setPageIndex] = React.useState(0)
  const scopeKeyRef = React.useRef<string>("")

  const [selectedThread, setSelectedThread] = React.useState<MailThread | undefined>(undefined)
  const [threadLoading, setThreadLoading] = React.useState(false)
  const [composeOpen, setComposeOpen] = React.useState(false)
  // Se incrementa al enviar un correo para forzar un refetch de la página actual (por si
  // estás viendo Enviados) — no cambia de carpeta ni de página, solo refresca lo que hay.
  const [refreshTick, setRefreshTick] = React.useState(0)
  // Igual que refreshTick pero para el detalle del thread abierto — se incrementa al
  // responder, para que la respuesta aparezca de una en la conversación sin recargar todo.
  const [threadRefreshTick, setThreadRefreshTick] = React.useState(0)

  function updateUrl(folder: Folder, threadId: string | null, goxt: boolean = goxtOnly) {
    const params = new URLSearchParams()
    params.set("folder", folder)
    if (threadId) params.set("thread", threadId)
    if (goxt) params.set("goxt", "1")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  React.useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // undefined = todavía no se sabe, null = no conectado, number = conectado
  React.useEffect(() => {
    integrationService.getWorkspaceIntegrations()
      .then((connections) => {
        const conn = connections.find((c) => c.provider_key === "gmail" && c.is_active)
        setGmailConnectionId(conn?.id ?? null)
        setGmailAccountEmail(conn?.account_email ?? null)
      })
      .catch(() => setGmailConnectionId(null))
  }, [])

  // Lista liviana, paginada. GOXT ignora la carpeta activa (es una búsqueda propia, cruza
  // toda la cuenta, igual que buscar en Gmail) — por eso se resuelve con su propio labelId
  // virtual en vez de combinarse con el de la carpeta.
  React.useEffect(() => {
    const scopeKey = `${activeFolder}:${goxtOnly}`
    const scopeChanged = scopeKeyRef.current !== scopeKey
    scopeKeyRef.current = scopeKey

    if (scopeChanged) {
      if (pageIndex !== 0) setPageIndex(0)
      setPageTokens([undefined])
    }

    const labelId = goxtOnly ? "GOXT" : FOLDER_TO_LABEL[activeFolder]
    if (!labelId || !gmailConnectionId) {
      setThreads([])
      return
    }

    const effectivePageIndex = scopeChanged ? 0 : pageIndex
    const effectiveTokens = scopeChanged ? [undefined] : pageTokens
    const pageToken = effectiveTokens[effectivePageIndex]

    let cancelled = false
    setListLoading(true)
    integrationService.getGmailThreads(gmailConnectionId, { labelId, maxResults: PAGE_SIZE, pageToken })
      .then((res) => {
        if (cancelled) return
        const mapped = res.threads.map(mapGmailThreadSummary)
        setThreads(mapped)
        setNextPageToken(res.nextPageToken)
        setResultSizeEstimate(res.resultSizeEstimate)
        // Si el thread de la URL ya no existe en esta página (o no había ninguno todavía),
        // se cae al primero — pero si seguía existiendo (ej. venías de un F5), se respeta.
        const stillExists = selectedThreadId && mapped.some((t) => t.id === selectedThreadId)
        if (!stillExists) updateUrl(activeFolder, mapped[0]?.id ?? null, goxtOnly)
      })
      .catch(() => { if (!cancelled) { setThreads([]); setNextPageToken(undefined); setResultSizeEstimate(undefined) } })
      .finally(() => { if (!cancelled) setListLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder, goxtOnly, gmailConnectionId, pageIndex, refreshTick])

  // Detalle completo (body, imágenes inline, adjuntos) — se pide aparte, solo para el
  // thread que efectivamente se abre, no para toda la lista.
  React.useEffect(() => {
    if (!selectedThreadId || !gmailConnectionId) {
      setSelectedThread(undefined)
      return
    }
    let cancelled = false
    setThreadLoading(true)
    integrationService.getGmailThread(gmailConnectionId, selectedThreadId)
      .then((raw) => {
        if (cancelled) return
        const mapped = mapGmailThread(raw)
        setSelectedThread(mapped)
        // Al abrir un thread sin leer se marca como leído — mismo criterio que la propia
        // bandeja de Gmail. No es crítico si falla (no interrumpe la lectura).
        if (!mapped.read) {
          integrationService.markGmailThreadRead(gmailConnectionId, selectedThreadId)
            .then(() => {
              setThreads((prev) =>
                prev.map((t) => (t.id === selectedThreadId ? { ...t, read: true, lastMessage: { ...t.lastMessage, read: true } } : t))
              )
            })
            .catch(() => {})
        }
      })
      .catch(() => { if (!cancelled) setSelectedThread(undefined) })
      .finally(() => { if (!cancelled) setThreadLoading(false) })
    return () => { cancelled = true }
  }, [selectedThreadId, gmailConnectionId, threadRefreshTick])

  function handleNextPage() {
    if (!nextPageToken) return
    setPageTokens((prev) => (pageIndex + 1 < prev.length ? prev : [...prev, nextPageToken]))
    setPageIndex((i) => i + 1)
  }

  function handlePrevPage() {
    setPageIndex((i) => Math.max(0, i - 1))
  }

  return (
    <>
      <PageHeader
        icon={MailIcon}
        title="Correo"
        description="Bandeja de entrada del workspace"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Columna 1 — carpetas */}
        <div className="flex w-52 shrink-0 flex-col overflow-hidden border-r">
          <div className="p-2">
            <Button
              className="w-full justify-start gap-2"
              disabled={!gmailConnectionId}
              onClick={() => setComposeOpen(true)}
            >
              <PencilLineIcon className="size-4" />
              Redactar
            </Button>
          </div>
          <MailNav activeFolder={activeFolder} onFolderChange={(folder) => updateUrl(folder, null, false)} />
        </div>

        {/* Columna 2 — lista (único scroll) */}
        <div className="flex w-105 shrink-0 flex-col overflow-hidden border-r">
          {gmailConnectionId === null ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <MailIcon className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">Gmail no está conectado</p>
              <p className="text-xs text-muted-foreground">
                Conéctalo en Configuración → Integraciones para ver tu correo real acá.
              </p>
            </div>
          ) : !goxtOnly && !FOLDER_TO_LABEL[activeFolder] ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-sm text-muted-foreground">Esta carpeta todavía no está conectada.</p>
            </div>
          ) : listLoading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 size-4 animate-spin" /> Cargando correos...
            </div>
          ) : (
            <MailList
              folder={activeFolder}
              threads={threads}
              selectedId={selectedThreadId}
              onSelect={(threadId) => updateUrl(activeFolder, threadId)}
              goxtOnly={goxtOnly}
              onGoxtOnlyChange={(value) => updateUrl(activeFolder, null, value)}
              hasPrevPage={pageIndex > 0}
              hasNextPage={!!nextPageToken}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              rangeStart={threads.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1}
              rangeEnd={pageIndex * PAGE_SIZE + threads.length}
              resultSizeEstimate={resultSizeEstimate}
            />
          )}
        </div>

        {/* Columna 3 — vista previa */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <MailDisplay
            thread={selectedThread}
            loading={threadLoading}
            connectionId={gmailConnectionId ?? null}
            accountEmail={gmailAccountEmail}
            onReplySent={() => {
              setThreadRefreshTick((t) => t + 1)
              setRefreshTick((t) => t + 1)
            }}
          />
        </div>
      </div>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        connectionId={gmailConnectionId ?? null}
        onSent={() => setRefreshTick((t) => t + 1)}
      />
    </>
  )
}

export default function MailPage() {
  return (
    <Suspense>
      <MailPageContent />
    </Suspense>
  )
}
