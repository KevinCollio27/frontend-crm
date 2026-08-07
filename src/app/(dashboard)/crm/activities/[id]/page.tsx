"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { activityService } from "@/services/activity.service"
import { ActivityDetail } from "@/components/dashboard/activities/ActivityDetail"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { ActivityRaw } from "@/types/activity"

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ActivityDetailSkeleton() {
  return (
    <>
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="size-7 animate-pulse rounded bg-muted" />
          <div className="h-4 w-px bg-border" />
          <div className="size-7 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-7 w-20 animate-pulse rounded bg-muted" />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Col1 */}
        <div className="flex w-[25%] shrink-0 flex-col gap-4 border-r p-4">
          <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-52 w-full animate-pulse rounded-xl bg-muted" />
        </div>
        {/* Col2 */}
        <div className="flex flex-1 flex-col border-r">
          <div className="flex gap-2 border-b px-4 py-3">
            {[80, 72, 64, 76, 68].map((w, i) => (
              <div key={i} className="h-7 animate-pulse rounded bg-muted" style={{ width: w }} />
            ))}
          </div>
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
        {/* Col3 */}
        <div className="flex w-[25%] shrink-0 flex-col gap-4 p-4">
          <div className="h-44 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [activity, setActivity] = React.useState<ActivityRaw | null>(null)
  const [loading, setLoading]   = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Tiempo real, nivel 2: alguien más edita/elimina ESTA actividad mientras la
  // estás viendo. Filtra por id — si la borraron, te saca de la página en vez
  // de dejarte viendo un detalle fantasma.
  useEntityRealtime("activity", (payload) => {
    const changedId = (payload.data as { id?: number })?.id
    if (changedId !== Number(id)) return
    if (payload.action === "deleted") {
      router.push("/crm/activities")
      return
    }
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    activityService.getById(Number(id))
      .then(setActivity)
      .catch(() => router.replace("/crm/activities"))
      .finally(() => setLoading(false))
  }, [id, refreshKey])

  if (loading) return <ActivityDetailSkeleton />
  if (!activity) return null

  return <ActivityDetail activity={activity} />
}
