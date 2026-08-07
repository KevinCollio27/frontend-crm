"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { noteService } from "@/services/note.service"
import { orgConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { NoteRaw } from "@/types/note"
import { NoteSheet } from "../sheets/NoteSheet"

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE  = 10
const DOT_COLORS = ["bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function contextBadge(note: NoteRaw): { label: string; name: string } | null {
  if (note.opportunity_activity?.title) return { label: "Actividad ligada",  name: note.opportunity_activity.title }
  if (note.person?.name)                return { label: "Contacto ligado",   name: note.person.name }
  if (note.organization?.name)          return { label: "Empresa ligada",    name: note.organization.name }
  return null
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NotasSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3.5 px-4 py-4">
          <div className="mt-1.5 size-2 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-12 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  opportunityId: number
}

export function NotasTab({ opportunityId }: Props) {
  const [notes, setNotes]             = React.useState<NoteRaw[]>([])
  const [page, setPage]               = React.useState(1)
  const [hasMore, setHasMore]         = React.useState(false)
  const [loading, setLoading]         = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [createOpen, setCreateOpen]   = React.useState(false)
  const [editNote, setEditNote]       = React.useState<NoteRaw | null>(null)
  const [refreshKey, setRefreshKey]   = React.useState(0)

  useEntityRealtime("note", (payload) => {
    const changedOppId = (payload.data as { opportunity_id?: number | null })?.opportunity_id
    if (changedOppId !== opportunityId) return
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotes([])
    setPage(1)

    noteService
      .list({ opportunity_id: opportunityId, take: PAGE_SIZE, page: 1 })
      .then((res) => {
        if (cancelled) return
        setNotes(res.data)
        setHasMore(res.nextPage !== null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [opportunityId, refreshKey])

  function loadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    noteService
      .list({ opportunity_id: opportunityId, take: PAGE_SIZE, page: nextPage })
      .then((res) => {
        setNotes((prev) => [...prev, ...res.data])
        setHasMore(res.nextPage !== null)
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  async function handleDelete(note: NoteRaw) {
    const confirmed = await orgConfirm.delete(note.title)
    if (!confirmed) return
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    const t0 = Date.now()
    console.log(`[notes-opp] delete start id=${note.id}`)
    noteService.delete(note.id)
      .then(() => {
        console.log(`[notes-opp] delete OK → ${Date.now() - t0}ms`)
        notify.success({ title: "Nota eliminada", description: `"${note.title}" fue eliminada.` })
      })
      .catch(() => {
        setNotes((prev) => [note, ...prev])
        notify.error({ title: "Algo salió mal", description: "No se pudo eliminar la nota." })
      })
  }

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-end border-b px-4 py-2.5">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" /> Agregar nota
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <NotasSkeleton />
      ) : notes.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Sin notas registradas para esta oportunidad.
        </p>
      ) : (
        <>
          <div className="divide-y">
            {notes.map((note, i) => {
              const ctx  = contextBadge(note)
              const date = new Date(note.created_at).toLocaleDateString("es-CL", {
                day: "numeric", month: "short", year: "numeric",
              }) + " · " + new Date(note.created_at).toLocaleTimeString("es-CL", {
                hour: "2-digit", minute: "2-digit",
              })

              return (
                <div key={note.id} className="flex min-w-0 gap-3.5 px-4 py-4">
                  <div className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug">{note.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{date}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:bg-muted"
                          onClick={() => setEditNote(note)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(note)}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {ctx && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">{ctx.label}:</span>
                        {ctx.name}
                      </span>
                    )}
                    <div
                      className="note-preview mt-2 text-sm leading-relaxed text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center py-3">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                {loadingMore ? "Cargando..." : "Cargar más"}
              </Button>
            </div>
          )}
        </>
      )}

      {createOpen && (
        <NoteSheet
          open
          onOpenChange={setCreateOpen}
          opportunityId={opportunityId}
          onSuccess={(created) => setNotes((prev) => [created, ...prev])}
        />
      )}
      {editNote !== null && (
        <NoteSheet
          open
          onOpenChange={(v) => { if (!v) setEditNote(null) }}
          opportunityId={opportunityId}
          note={editNote}
          onSuccess={(updated) => {
            setNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n))
            setEditNote(null)
          }}
        />
      )}

    </div>
  )
}
