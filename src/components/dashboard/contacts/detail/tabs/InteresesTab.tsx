"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { interestService } from "@/services/interest.service"
import { orgConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { PersonInterestRaw } from "@/types/interest"
import { InterestSheet } from "../sheets/InterestSheet"

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function InteresesSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3.5 px-4 py-4">
          <div className="mt-0.5 size-5 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  contactId: number
}

export function InteresesTab({ contactId }: Props) {
  const [interests, setInterests]       = React.useState<PersonInterestRaw[]>([])
  const [loading, setLoading]           = React.useState(true)
  const [refreshKey, setRefreshKey]     = React.useState(0)
  const [createOpen, setCreateOpen]     = React.useState(false)
  const [editInterest, setEditInterest] = React.useState<PersonInterestRaw | null>(null)

  // El evento real es "person-interest" (con guion), no "personInterest" —
  // ver personInterest.controller.ts. Los 3 acciones (creado/editado/eliminado)
  // traen person_id, así que se puede filtrar siempre, sin excepción en deleted.
  useEntityRealtime("person-interest", (payload) => {
    const changedPersonId = (payload.data as { person_id?: number | null })?.person_id
    if (changedPersonId !== contactId) return
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    interestService
      .list(contactId)
      .then((data) => { if (!cancelled) setInterests(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [contactId, refreshKey])

  async function handleDelete(interest: PersonInterestRaw) {
    const confirmed = await orgConfirm.delete(interest.description)
    if (!confirmed) return
    try {
      const t0 = Date.now()
      console.log(`[interests-contact] delete start id=${interest.id}`)
      await interestService.delete(interest.id)
      console.log(`[interests-contact] delete OK → ${Date.now() - t0}ms`)
      notify.success({ title: "Interés eliminado", description: `"${interest.description}" fue eliminado.` })
      setRefreshKey((k) => k + 1)
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo eliminar el interés." })
    }
  }

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-end border-b px-4 py-2.5">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" /> Agregar interés
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <InteresesSkeleton />
      ) : interests.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Sin intereses registrados.
        </p>
      ) : (
        <div className="divide-y">
          {interests.map((interest) => (
            <div key={interest.id} className="flex items-start gap-3.5 px-4 py-4">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                {interest.order_number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{interest.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(interest.created_at).toLocaleDateString("es-CL", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-muted"
                  onClick={() => setEditInterest(interest)}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(interest)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <InterestSheet
          open
          onOpenChange={setCreateOpen}
          contactId={contactId}
          nextOrder={interests.length + 1}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {editInterest !== null && (
        <InterestSheet
          open
          onOpenChange={(v) => { if (!v) setEditInterest(null) }}
          contactId={contactId}
          nextOrder={editInterest.order_number}
          interest={editInterest}
          onSuccess={() => { setEditInterest(null); setRefreshKey((k) => k + 1) }}
        />
      )}
    </div>
  )
}
