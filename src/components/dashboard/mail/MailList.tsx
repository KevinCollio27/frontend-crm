"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
// import { Badge } from "@/components/ui/badge" // badge GOXT oculto por ahora
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MailThreadSummary, Folder } from "./data"

const FOLDER_LABELS: Record<Folder, string> = {
  inbox: "Bandeja",
  sent: "Enviado",
  junk: "Correo no deseado",
  trash: "Eliminados",
  archive: "Archivo",
}

const SKELETON_ROWS = 8

function MailRowSkeleton() {
  return (
    <div className="flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-10 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  )
}

interface MailListProps {
  folder: Folder
  threads: MailThreadSummary[]
  // Mientras carga, el header/tabs/buscador siguen montados — solo el área de resultados
  // se reemplaza por filas skeleton (mismo criterio que ContactsTable). Antes se reemplazaba
  // todo MailList por un spinner, lo que hacía que el buscador "desapareciera" al buscar.
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  // GOXT cambia el dataset fetcheado (búsqueda real from:goxt.io, paginada) — no es un filtro
  // client-side como "No leídos", por eso vive arriba en page.tsx en vez de estado local acá.
  goxtOnly: boolean
  onGoxtOnlyChange: (value: boolean) => void
  // Búsqueda libre — mismo criterio que GOXT: cambia el dataset fetcheado (Gmail real,
  // paginado), por eso el valor comprometido vive en page.tsx. searchInput es el valor tal
  // cual lo escribe el usuario (responde a cada tecla, sin buscar todavía); onSearchSubmit
  // recién dispara la búsqueda real, al presionar Enter — igual que Gmail. searchActive
  // refleja el último valor comprometido (no lo que se está tipeando).
  searchInput: string
  onSearchInputChange: (value: string) => void
  onSearchSubmit: (value: string) => void
  searchActive: boolean
  hasPrevPage: boolean
  hasNextPage: boolean
  onPrevPage: () => void
  onNextPage: () => void
  rangeStart: number
  rangeEnd: number
  // Estimación de Gmail (mismo campo que usa su propia bandeja) — no es exacto, así que se
  // muestra con "~" cuando hay más de una página, igual que Gmail para carpetas grandes.
  resultSizeEstimate?: number
  // Select de carpeta + botón Redactar armados en page.tsx (mobile only) — reemplaza
  // al título fijo, mismo patrón que el channelSelect de Mensajería.
  mobileHeader?: React.ReactNode
}

export function MailList({
  folder,
  threads,
  loading,
  selectedId,
  onSelect,
  goxtOnly,
  onGoxtOnlyChange,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  searchActive,
  hasPrevPage,
  hasNextPage,
  onPrevPage,
  onNextPage,
  rangeStart,
  rangeEnd,
  resultSizeEstimate,
  mobileHeader,
}: MailListProps) {
  const [tab, setTab] = React.useState<"all" | "unread">("all")

  // "No leídos" es lo único que sigue siendo un filtro client-side — la búsqueda por texto
  // ya viene resuelta desde Gmail (ver page.tsx), así que threads acá ya es el resultado final.
  const filtered = threads.filter((t) => (tab === "unread" ? !t.read : true))

  return (
    <div className="flex h-full flex-col">
      {/* Header. En mobile, mobileHeader (w-full) fuerza el resto a la fila de
          abajo vía flex-wrap; en desktop no se renderiza (md:hidden) y queda
          como antes, una sola fila. */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        {mobileHeader}
        <h2 className="hidden flex-1 text-base font-semibold md:block">
          {searchActive ? "Resultados de búsqueda" : goxtOnly ? "Bandeja" : FOLDER_LABELS[folder]}
        </h2>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="unread">No leídos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-8 pr-8"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onSearchSubmit(searchInput) }
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { onSearchInputChange(""); onSearchSubmit("") }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant={goxtOnly ? "default" : "outline"}
          size="sm"
          className="shrink-0"
          onClick={() => onGoxtOnlyChange(!goxtOnly)}
        >
          GOXT
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <div className="flex flex-col gap-1 px-2 pb-2">
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <MailRowSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
        ) : (
          <div className="flex flex-col gap-1 px-2 pb-2">
            {filtered.map((thread) => {
              const last = thread.lastMessage
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onSelect(thread.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    selectedId === thread.id ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  {/* Name + date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!thread.read && (
                        <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                      <span className={cn("truncate text-sm", !thread.read ? "font-semibold" : "font-medium")}>
                        {last.name}
                      </span>
                      {thread.messageCount > 1 && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          ({thread.messageCount})
                        </span>
                      )}
                      {/* Badge GOXT oculto por ahora, ver referencia tweakcn sin labels */}
                      {/* {last.isGoxtSystem && (
                        <Badge variant="secondary" className="shrink-0 rounded-full px-2 py-0 text-[0.65rem]">
                          GOXT
                        </Badge>
                      )} */}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        selectedId === thread.id ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {formatDistanceToNow(new Date(thread.date), { locale: es })}
                    </span>
                  </div>

                  {/* Subject */}
                  <p className={cn("truncate text-sm text-foreground", !thread.read ? "font-medium" : "font-normal")}>
                    {thread.subject}
                  </p>

                  {/* Preview */}
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {last.text}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Paginado — igual criterio que la propia bandeja de Gmail (1-10 de ~2,075, Siguiente/Anterior) */}
      <div className="flex items-center justify-end gap-2 border-t px-3 py-1.5">
        {!loading && rangeStart > 0 && (
          <span className="text-xs text-muted-foreground">
            {rangeStart}–{rangeEnd}
            {resultSizeEstimate !== undefined && (
              <> de {hasNextPage ? "~" : ""}{resultSizeEstimate.toLocaleString("es-CL")}</>
            )}
          </span>
        )}
        <Button variant="ghost" size="icon" className="size-7" disabled={loading || !hasPrevPage} onClick={onPrevPage} title="Anterior">
          <ChevronLeftIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" disabled={loading || !hasNextPage} onClick={onNextPage} title="Siguiente">
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
