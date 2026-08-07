"use client"

import * as React from "react"
import { AlertTriangleIcon, Building2Icon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { organizationService } from "@/services/organization.service"
import type { OrganizationDuplicateGroup } from "@/types/organization"
import { MergeOrganizationsSheet } from "./MergeOrganizationsSheet"

function Skeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-lg border p-4">
          <div className="space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMerged?: () => void
}

export function DuplicateOrganizationsSheet({ open, onOpenChange, onMerged }: Props) {
  const [groups, setGroups] = React.useState<OrganizationDuplicateGroup[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [selectedGroup, setSelectedGroup] = React.useState<OrganizationDuplicateGroup | null>(null)

  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    organizationService
      .findDuplicates()
      .then((res) => { if (!cancelled) setGroups(res) })
      .catch(() => { if (!cancelled) setGroups([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, refreshKey])

  function handleMerged() {
    setSelectedGroup(null)
    setRefreshKey((k) => k + 1)
    onMerged?.()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 720, padding: 0, gap: 0 }} className="w-full flex flex-col">
          <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div className="space-y-0.5">
              <SheetTitle className="flex items-center gap-2">
                <Building2Icon className="size-4 text-muted-foreground" />
                Fusionar duplicados
              </SheetTitle>
              <SheetDescription>
                {loading ? "Buscando organizaciones duplicadas…" : `${groups.length} grupo${groups.length === 1 ? "" : "s"} de posibles duplicados detectados`}
              </SheetDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={() => onOpenChange(false)}
              aria-label="Cerrar"
            >
              <XIcon />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <Skeleton />
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-sm text-muted-foreground">No se detectaron organizaciones duplicadas por nombre.</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Si dos organizaciones son la misma empresa pero con nombres distintos (ej. con o sin razón social), la detección automática no las junta — puedes fusionarlas a mano.
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-5">
                {groups.map((group) => (
                  <div key={group.key} className="flex items-center justify-between gap-3 rounded-lg border p-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{group.organizations[0].name}</p>
                        <p className="text-xs text-muted-foreground">{group.organizations.length} organizaciones</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => setSelectedGroup(group)}>
                      Revisar y fusionar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSelectedGroup({ key: "manual", organizations: [] })}
            >
              <PlusIcon className="size-4" />
              Fusión manual (buscar organizaciones)
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {selectedGroup && (
        <MergeOrganizationsSheet
          open
          group={selectedGroup}
          onOpenChange={(o) => { if (!o) setSelectedGroup(null) }}
          onMerged={handleMerged}
        />
      )}
    </>
  )
}
