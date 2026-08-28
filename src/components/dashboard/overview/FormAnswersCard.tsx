"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ClipboardListIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollDownHint } from "./ScrollDownHint"
import { useScrollHint } from "@/hooks/useScrollHint"
import { formService } from "@/services/form.service"
import type { FormAnswerRaw } from "@/types/form"

// Adaptación real de Ref14 — mismo layout, conectada a widget-forms/answers (ya existía,
// cero backend nuevo). "Ver Detalles" lleva a la oportunidad relacionada — ojo, no hay
// todavía un tab de Formularios en el detalle, así que no resalta la respuesta puntual
// (gap ya anotado, pendiente aparte). Altura fija con scroll interno y "Cargar más" —
// igual que Mensajería/Correo (h-104, no el h-92 del resto): cada fila son 3 líneas de
// texto y con h-92 el 3er ítem quedaba cortado antes de tiempo.
const TAKE = 8

// Si el formulario no tiene respuestas de texto (caso común: solo capturó el contacto),
// el genérico "Sin respuestas adicionales." dejaba la fila muy corta — se usa el email/
// teléfono del contacto como contenido real en vez de forzar una altura vacía.
function previewOf(answer: FormAnswerRaw): string {
  const values = Object.values(answer.answers).filter((v): v is string => typeof v === "string" && v.trim().length > 0)
  if (values.length > 0) return values.slice(0, 2).join(" · ")

  const contactInfo = [answer.person?.email, answer.person?.phone].filter(Boolean).join(" · ")
  return contactInfo || "Sin respuestas adicionales."
}

function AnswerSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

export function FormAnswersCard() {
  const router = useRouter()
  const [answers, setAnswers] = React.useState<FormAnswerRaw[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [hasMore, setHasMore] = React.useState(false)
  const { ref: scrollRef, canScrollDown, scrollStep, onScroll } = useScrollHint<HTMLDivElement>([answers])

  React.useEffect(() => {
    let cancelled = false
    formService.listAllAnswers({ take: TAKE })
      .then((res) => {
        if (cancelled) return
        setAnswers(res.data)
        setCursor(res.nextCursor)
        setHasMore(res.nextCursor !== null)
      })
      .catch(() => { if (!cancelled) setAnswers([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function loadMore() {
    if (!cursor) return
    setLoadingMore(true)
    formService.listAllAnswers({ take: TAKE, cursor })
      .then((res) => {
        setAnswers((prev) => [...prev, ...res.data])
        setCursor(res.nextCursor)
        setHasMore(res.nextCursor !== null)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  return (
    <Card className="h-104">
      <CardContent className="flex h-full flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2.5">
          <ClipboardListIcon className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Formularios</p>
            <p className="text-base font-semibold">Nuevas Respuestas</p>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 divide-y overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => <AnswerSkeleton key={i} />)}
          </div>
        ) : answers.length === 0 ? (
          <p className="flex-1 py-8 text-center text-sm text-muted-foreground">Sin respuestas registradas.</p>
        ) : (
          <div className="relative flex-1 overflow-hidden">
            <div ref={scrollRef} onScroll={onScroll} className="h-full divide-y overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {answers.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.form?.name ?? "Formulario"}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.person?.name ?? a.organization?.name ?? "—"}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{previewOf(a)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: es })}
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      title="Ver Detalles"
                      onClick={() => router.push(`/crm/funnels/${a.opportunity_id}`)}
                    >
                      <ExternalLinkIcon className="size-4" />
                    </button>
                  </div>
                </div>
              ))}

              {hasMore && (
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
