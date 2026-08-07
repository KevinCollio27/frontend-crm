"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { orgChallengeService, type OrgChallengeRaw } from "@/services/organizationChallenge.service"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { orgConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { ChallengeSheet } from "../sheets/ChallengeSheet"

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DesafiosSkeleton() {
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

interface Props { orgId: number }

export function DesafiosTab({ orgId }: Props) {
  const [challenges, setChallenges] = React.useState<OrgChallengeRaw[]>([])
  const [loading, setLoading]       = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editChallenge, setEditChallenge] = React.useState<OrgChallengeRaw | null>(null)

  useEntityRealtime("organization-challenge", (payload) => {
    const changedOrgId = (payload.data as { organization_id?: number })?.organization_id
    if (changedOrgId !== orgId) return
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    orgChallengeService
      .list(orgId)
      .then((data) => { if (!cancelled) setChallenges(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [orgId, refreshKey])

  async function handleDelete(challenge: OrgChallengeRaw) {
    const confirmed = await orgConfirm.delete(challenge.description)
    if (!confirmed) return
    try {
      await orgChallengeService.delete(challenge.id)
      notify.success({ title: "Desafío eliminado", description: `"${challenge.description}" fue eliminado.` })
      setRefreshKey((k) => k + 1)
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo eliminar el desafío." })
    }
  }

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-end border-b px-4 py-2.5">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" /> Agregar desafío
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <DesafiosSkeleton />
      ) : challenges.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Sin desafíos registrados.
        </p>
      ) : (
        <div className="divide-y">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="flex items-start gap-3.5 px-4 py-4">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                {challenge.order_number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{challenge.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(challenge.created_at).toLocaleDateString("es-CL", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-muted"
                  onClick={() => setEditChallenge(challenge)}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(challenge)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <ChallengeSheet
          open
          onOpenChange={setCreateOpen}
          orgId={orgId}
          nextOrder={challenges.length + 1}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {editChallenge !== null && (
        <ChallengeSheet
          open
          onOpenChange={(v) => { if (!v) setEditChallenge(null) }}
          orgId={orgId}
          nextOrder={editChallenge.order_number}
          challenge={editChallenge}
          onSuccess={() => { setEditChallenge(null); setRefreshKey((k) => k + 1) }}
        />
      )}
    </div>
  )
}
