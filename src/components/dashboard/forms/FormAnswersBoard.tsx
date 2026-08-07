"use client"

import * as React from "react"
import { format, formatDistanceToNowStrict, subHours } from "date-fns"
import { es } from "date-fns/locale"
import { InboxIcon, Loader2Icon, PlusCircleIcon, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { getInitials } from "@/lib/table-utils"
import { formService } from "@/services/form.service"
import { FormAnswerDetail } from "./FormAnswerDetail"
import type { FormAnswerRaw, FormRaw } from "@/types/form"

// ─── Filtro por formulario — mismo patrón que FlowFilter en Oportunidades ────
// (ícono + label fijo "Formulario" + chip con el valor elegido, en vez de un
// selector tipo Select que reemplaza su propio texto).

function FormFilter({
  forms,
  selected,
  onChange,
}: {
  forms: FormRaw[]
  selected: number | null
  onChange: (id: number | null) => void
}) {
  const selectedForm = forms.find((f) => f.id === selected)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 shrink-0 border-dashed" />}>
        <PlusCircleIcon className="size-3.5" />
        Formulario
        {selected !== null && (
          <>
            <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-auto" />
            <span className="inline-block max-w-32 truncate rounded bg-muted px-1.5 py-0.5 align-middle text-xs font-medium">
              {selectedForm?.name ?? "…"}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-60 min-w-44 overflow-y-auto">
        {forms.map((form) => (
          <DropdownMenuCheckboxItem
            key={form.id}
            checked={selected === form.id}
            onCheckedChange={() => onChange(selected === form.id ? null : form.id)}
          >
            {form.name}
          </DropdownMenuCheckboxItem>
        ))}
        {selected !== null && (
          <>
            <DropdownMenuSeparator />
            <button
              className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onChange(null)}
            >
              Limpiar filtro
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const PAGE_SIZE = 25

// "hace 5 minutos" / "hace 2 horas" para lo reciente (últimas 24h) — pasado eso,
// la fecha completa (27/07/2026), que ya no es preciso seguir contando en relativo.
export function formatAnswerDate(iso: string): string {
  const date = new Date(iso)
  if (date > subHours(new Date(), 24)) {
    return `hace ${formatDistanceToNowStrict(date, { locale: es })}`
  }
  return format(date, "dd/MM/yyyy")
}

// Color por formulario — no hay una categoría real todavía, pero un color estable
// por form.id ya deja identificar de un vistazo "ah, las moradas son de este form".
const FORM_BADGE_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400",
]

export function formColor(formId: number): string {
  return FORM_BADGE_COLORS[formId % FORM_BADGE_COLORS.length]
}

// Truncado determinístico en JS en vez de confiar en `truncate` de CSS — dentro de
// una fila flex apretada (avatar + nombre + fecha + badges) el text-overflow:ellipsis
// terminaba recortando por el lado equivocado en vez de mantener el inicio del texto.
export function truncateText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

// Casi todos los formularios piden nombre y correo, pero no es garantía — sin nombre,
// "Sin nombre" no dice nada útil. Mejor identificar la respuesta por lo que es.
export function answerDisplayName(answer: FormAnswerRaw): string {
  if (answer.person?.name) return answer.person.name
  return `Nueva Respuesta: ${answer.form?.name ?? "Formulario"}`
}

// ─── Col 1: listado de respuestas ──────────────────────────────────────────────
// La col 2 (vista previa del detalle) queda para la próxima ronda — por ahora es
// un placeholder, pero el shell de 2 columnas ya queda armado para no rehacer el
// layout después.

export function FormAnswersBoard({ viewToggle }: { viewToggle?: React.ReactNode } = {}) {
  const [answers, setAnswers]     = React.useState<FormAnswerRaw[]>([])
  const [loading, setLoading]     = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [nextCursor, setNextCursor] = React.useState<string | null>(null)
  const [total, setTotal]         = React.useState(0)
  const [search, setSearch]       = React.useState("")
  const [selectedId, setSelectedId] = React.useState<number | null>(null)
  const [forms, setForms]         = React.useState<FormRaw[]>([])
  const [formFilter, setFormFilter] = React.useState<number | null>(null)

  // Lista de formularios para el filtro — se pide una sola vez, es independiente
  // de qué página de respuestas esté cargada.
  React.useEffect(() => {
    formService.list({ take: 100 }).then((res) => setForms(res.data)).catch(() => {})
  }, [])

  // El filtro por formulario tiene que resolverse en el servidor, no filtrando
  // lo que ya está cargado en pantalla — con 600+ respuestas y páginas de 25,
  // filtrar solo lo cargado dejaría la lista casi vacía hasta cargar muchas
  // páginas más. Por eso cambiar el filtro reinicia la paginación (cursor, etc.)
  // y vuelve a pedir desde cero con form_id.
  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    formService.listAllAnswers({ take: PAGE_SIZE, form_id: formFilter ?? undefined })
      .then((res) => {
        if (cancelled) return
        setAnswers(res.data)
        setTotal(res.total)
        setNextCursor(res.nextCursor)
        setSelectedId(res.data[0]?.id ?? null)
      })
      .catch(() => { if (!cancelled) setAnswers([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [formFilter])

  function handleToggled(answerId: number, isActive: boolean) {
    setAnswers((prev) => prev.map((a) => (a.id === answerId ? { ...a, is_active: isActive } : a)))
  }

  function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    formService.listAllAnswers({ cursor: nextCursor, take: PAGE_SIZE, form_id: formFilter ?? undefined })
      .then((res) => {
        // Dedupe por id: si entre el fetch anterior y este se creó/eliminó algo
        // justo en el borde del cursor, mejor no arriesgar filas repetidas.
        setAnswers((prev) => {
          const seen = new Set(prev.map((a) => a.id))
          return [...prev, ...res.data.filter((a) => !seen.has(a.id))]
        })
        setNextCursor(res.nextCursor)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return answers
    return answers.filter((a) =>
      (a.person?.name ?? "").toLowerCase().includes(q) ||
      (a.person?.email ?? "").toLowerCase().includes(q)
    )
  }, [answers, search])

  const selectedAnswer = answers.find((a) => a.id === selectedId) ?? null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Row 1 — view toggle, mismo alto que Lista para que cambiar de tab no
          dé el salto visual de pasar de una fila a otra de distinta altura. */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        {viewToggle}
      </div>

      {/* Row 2 — filters */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <div className="relative w-44 shrink-0">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="h-8 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FormFilter forms={forms} selected={formFilter} onChange={setFormFilter} />
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {loading ? "…" : `${total} respuesta${total === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Col 1 */}
        <div className="flex w-96 shrink-0 flex-col overflow-hidden border-r">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <InboxIcon className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No hay respuestas en este momento.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 px-2 pb-2">
                {filtered.map((answer) => {
                  const name = answerDisplayName(answer)
                  const isActive = selectedId === answer.id
                  return (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() => setSelectedId(answer.id)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        isActive ? "bg-muted" : "hover:bg-muted/50"
                      )}
                    >
                      <Avatar size="default" className="mt-0.5 shrink-0">
                        <AvatarImage src="https://github.com/shadcn.png" alt={name} />
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatAnswerDate(answer.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {answer.form && (
                            <Badge
                              className={cn("shrink-0 rounded-full border-0 px-2 py-0 text-[0.65rem] font-medium", formColor(answer.form.id))}
                              title={answer.form.name}
                            >
                              {truncateText(answer.form.name, 28)}
                            </Badge>
                          )}
                          {!answer.is_active && (
                            <Badge variant="secondary" className="shrink-0 rounded-full px-2 py-0 text-[0.65rem] font-normal">
                              Oculta
                            </Badge>
                          )}
                        </div>
                        {answer.person?.email && (
                          <p className="truncate text-xs text-muted-foreground">{answer.person.email}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {nextCursor && (
                <div className="flex justify-center p-3">
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                    Cargar más
                  </Button>
                </div>
              )}
            </>
          )}
          </div>
        </div>

        {/* Col 2 — vista previa */}
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {selectedAnswer ? (
            <FormAnswerDetail answer={selectedAnswer} onToggled={handleToggled} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Selecciona una respuesta para ver el detalle
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
