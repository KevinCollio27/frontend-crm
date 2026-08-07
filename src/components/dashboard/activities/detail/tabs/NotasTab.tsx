"use client"

import * as React from "react"
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { noteService } from "@/services/note.service"
import { orgConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { NoteRaw } from "@/types/note"
import { NoteSheet } from "../sheets/NoteSheet"

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE  = 10
const DOT_COLORS = ["bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500"]

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
  activityId: number
}

export function NotasTab({ activityId }: Props) {
  const [notes, setNotes]             = React.useState<NoteRaw[]>([])
  const [page, setPage]               = React.useState(1)
  const [hasMore, setHasMore]         = React.useState(false)
  const [loading, setLoading]         = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [refreshKey, setRefreshKey]   = React.useState(0)
  const [createOpen, setCreateOpen]   = React.useState(false)
  const [editNote, setEditNote]       = React.useState<NoteRaw | null>(null)

  useEntityRealtime("note", (payload) => {
    const changedActivityId = (payload.data as { opportunity_activity_id?: number | null })?.opportunity_activity_id
    if (changedActivityId !== activityId) return
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotes([])
    setPage(1)
    noteService
      .list({ opportunity_activity_id: activityId, take: PAGE_SIZE, page: 1 })
      .then((res) => {
        if (cancelled) return
        setNotes(res.data)
        setHasMore(res.nextPage !== null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activityId, refreshKey])

  function loadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    noteService
      .list({ opportunity_activity_id: activityId, take: PAGE_SIZE, page: nextPage })
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
    try {
      await noteService.delete(note.id)
      notify.success({ title: "Nota eliminada", description: `"${note.title}" fue eliminada.` })
      setRefreshKey((k) => k + 1)
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo eliminar la nota." })
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-end border-b px-4 py-2.5">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" /> Agregar nota
        </Button>
      </div>

      {loading ? (
        <NotasSkeleton />
      ) : notes.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Sin notas registradas.
        </p>
      ) : (
        <>
          <div className="divide-y">
            {notes.map((note, i) => {
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
          activityId={activityId}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {editNote !== null && (
        <NoteSheet
          open
          onOpenChange={(v) => { if (!v) setEditNote(null) }}
          activityId={activityId}
          note={editNote}
          onSuccess={() => { setEditNote(null); setRefreshKey((k) => k + 1) }}
        />
      )}
    </div>
  )
}
