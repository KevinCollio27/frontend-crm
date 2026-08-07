"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react"
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

interface MailListProps {
  folder: Folder
  threads: MailThreadSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
  // GOXT cambia el dataset fetcheado (búsqueda real from:goxt.io, paginada) — no es un filtro
  // client-side como "No leídos", por eso vive arriba en page.tsx en vez de estado local acá.
  goxtOnly: boolean
  onGoxtOnlyChange: (value: boolean) => void
  hasPrevPage: boolean
  hasNextPage: boolean
  onPrevPage: () => void
  onNextPage: () => void
  rangeStart: number
  rangeEnd: number
  // Estimación de Gmail (mismo campo que usa su propia bandeja) — no es exacto, así que se
  // muestra con "~" cuando hay más de una página, igual que Gmail para carpetas grandes.
  resultSizeEstimate?: number
}

export function MailList({
  folder,
  threads,
  selectedId,
  onSelect,
  goxtOnly,
  onGoxtOnlyChange,
  hasPrevPage,
  hasNextPage,
  onPrevPage,
  onNextPage,
  rangeStart,
  rangeEnd,
  resultSizeEstimate,
}: MailListProps) {
  const [search, setSearch] = React.useState("")
  const [tab, setTab] = React.useState<"all" | "unread">("all")

  const filtered = threads.filter((t) => {
    if (tab === "unread" && t.read) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        t.lastMessage.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.lastMessage.text.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2">
        <h2 className="flex-1 text-base font-semibold">{goxtOnly ? "Bandeja" : FOLDER_LABELS[folder]}</h2>
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
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        {filtered.length === 0 ? (
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
        {rangeStart > 0 && (
          <span className="text-xs text-muted-foreground">
            {rangeStart}–{rangeEnd}
            {resultSizeEstimate !== undefined && (
              <> de {hasNextPage ? "~" : ""}{resultSizeEstimate.toLocaleString("es-CL")}</>
            )}
          </span>
        )}
        <Button variant="ghost" size="icon" className="size-7" disabled={!hasPrevPage} onClick={onPrevPage} title="Anterior">
          <ChevronLeftIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" disabled={!hasNextPage} onClick={onNextPage} title="Siguiente">
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
