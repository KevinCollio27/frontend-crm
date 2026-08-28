"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ExternalLinkIcon, Loader2Icon, MailIcon } from "lucide-react"
import { SiGmail } from "react-icons/si"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollDownHint } from "./ScrollDownHint"
import { useScrollHint } from "@/hooks/useScrollHint"
import { cn } from "@/lib/utils"
import { integrationNotify } from "@/lib/notify"
import { integrationService } from "@/services/integration.service"
import type { GmailThreadSummaryRaw } from "@/types/integration"

// Adaptación real de Ref16 — fila calcada de MailList.tsx (la bandeja real en /crm/mail),
// conectada a Gmail vía integration.service.ts (mismo mecanismo que ya usa MiniCalendarCard
// para Google Calendar). Altura fija con scroll interno — no crece con más correos.
// A diferencia del resto (h-92), acá queda un poco más alta (h-104): cada correo ocupa
// 3 líneas de texto y con h-92 el 3er correo quedaba cortado antes de tiempo.
const MAX_RESULTS = 10

function MailSkeleton() {
  return (
    <div className="space-y-1.5 py-3.5">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
    </div>
  )
}

export function MailPreviewCard() {
  const router = useRouter()
  const [threads, setThreads] = React.useState<GmailThreadSummaryRaw[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [connected, setConnected] = React.useState(true)
  const [connecting, setConnecting] = React.useState(false)
  const [integrationId, setIntegrationId] = React.useState<number | null>(null)
  const [pageToken, setPageToken] = React.useState<string | undefined>(undefined)
  const { ref: scrollRef, canScrollDown, scrollStep, onScroll } = useScrollHint<HTMLDivElement>([threads])

  // Reutilizable para volver a cargar después de conectar Gmail desde el botón — a
  // diferencia del efecto de montaje (abajo), esta sí se puede llamar con setLoading(true)
  // síncrono porque corre desde un handler de evento, no desde un efecto.
  function loadMail() {
    setLoading(true)
    integrationService.getWorkspaceIntegrations()
      .then((connections) => {
        const conn = connections.find((c) => c.provider_key === "gmail" && c.is_active)
        if (!conn) {
          setConnected(false)
          setLoading(false)
          return
        }
        setConnected(true)
        setIntegrationId(conn.id)
        return integrationService.getGmailThreads(conn.id, { labelId: "INBOX", maxResults: MAX_RESULTS })
          .then((page) => {
            setThreads(page.threads)
            setPageToken(page.nextPageToken)
          })
          .catch(() => setThreads([]))
          .finally(() => setLoading(false))
      })
      .catch(() => { setConnected(false); setLoading(false) })
  }

  React.useEffect(() => {
    let cancelled = false
    integrationService.getWorkspaceIntegrations()
      .then((connections) => {
        const conn = connections.find((c) => c.provider_key === "gmail" && c.is_active)
        if (!conn) {
          if (!cancelled) { setConnected(false); setLoading(false) }
          return
        }
        if (cancelled) return
        setConnected(true)
        setIntegrationId(conn.id)
        return integrationService.getGmailThreads(conn.id, { labelId: "INBOX", maxResults: MAX_RESULTS })
          .then((page) => {
            if (cancelled) return
            setThreads(page.threads)
            setPageToken(page.nextPageToken)
          })
          .catch(() => { if (!cancelled) setThreads([]) })
          .finally(() => { if (!cancelled) setLoading(false) })
      })
      .catch(() => { if (!cancelled) { setConnected(false); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  // Escucha el mismo aviso que ya usa la página de Configuración → Integraciones cuando
  // el popup de Google termina el OAuth (ver src/app/(public)/auth/gmail/callback).
  React.useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === "GMAIL_AUTH_SUCCESS") {
        integrationNotify.connected("Gmail")
        loadMail()
      } else if (event.data?.type === "GMAIL_AUTH_ERROR") {
        integrationNotify.error(event.data.message ?? "No se pudo conectar Gmail.")
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [loadMail])

  async function handleConnect() {
    setConnecting(true)
    try {
      const authUrl = await integrationService.getGmailAuthUrl()
      const popup = window.open(authUrl, "gmail-oauth", "width=520,height=650")
      if (!popup) {
        integrationNotify.error("El navegador bloqueó la ventana emergente. Habilita los popups para este sitio e intenta de nuevo.")
      }
    } catch (error) {
      integrationNotify.error((error as { message?: string })?.message ?? "No se pudo iniciar la conexión con Gmail.")
    } finally {
      setConnecting(false)
    }
  }

  function loadMore() {
    if (!integrationId || !pageToken) return
    setLoadingMore(true)
    integrationService.getGmailThreads(integrationId, { labelId: "INBOX", maxResults: MAX_RESULTS, pageToken })
      .then((page) => {
        setThreads((prev) => [...prev, ...page.threads])
        setPageToken(page.nextPageToken)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  return (
    <Card className="h-104">
      <CardContent className="flex h-full flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2.5">
          <MailIcon className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Correo</p>
            <p className="text-base font-semibold">Bandeja de Entrada</p>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 divide-y overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => <MailSkeleton key={i} />)}
          </div>
        ) : !connected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">Conecta tu correo para ver la bandeja acá.</p>
            <Button size="sm" className="gap-1.5" onClick={handleConnect} disabled={connecting}>
              {connecting ? <Loader2Icon className="size-3.5 animate-spin" /> : <SiGmail className="size-3.5" />}
              Conectar con Gmail
            </Button>
          </div>
        ) : threads.length === 0 ? (
          <p className="flex-1 py-8 text-center text-sm text-muted-foreground">Sin correos en la bandeja.</p>
        ) : (
          <div className="relative flex-1 overflow-hidden">
            <div ref={scrollRef} onScroll={onScroll} className="h-full divide-y overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {threads.map((t) => (
                <div key={t.id} className="flex items-start gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className={cn("flex items-center gap-1.5 truncate text-sm", t.isUnread ? "font-semibold" : "font-medium")}>
                      {t.isUnread && <span className="size-2 shrink-0 rounded-full bg-blue-500" />}
                      {t.lastMessage.fromName || t.lastMessage.fromEmail}
                    </p>
                    <p className={cn("truncate text-sm", t.isUnread ? "font-medium" : "text-muted-foreground")}>
                      {t.subject}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.lastMessage.snippet}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(t.lastDate), { addSuffix: true, locale: es })}
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      title="Ver Detalles"
                      onClick={() => router.push(`/crm/mail?folder=inbox&thread=${t.id}`)}
                    >
                      <ExternalLinkIcon className="size-4" />
                    </button>
                  </div>
                </div>
              ))}

              {pageToken && (
                <div className="flex justify-center py-3">
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                    {loadingMore ? "Cargando..." : "Cargar más"}
                  </Button>
                </div>
              )}
            </div>
            <ScrollDownHint visible={canScrollDown} onClick={scrollStep} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
