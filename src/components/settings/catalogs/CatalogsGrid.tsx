"use client"

import * as React from "react"
import {
  BriefcaseIcon,
  CalendarIcon,
  LayersIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TagIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { catalogService } from "@/services/catalog.service"
import type { LabelRaw } from "@/types/catalog"
import { CatalogOptionsSheet } from "./CatalogOptionsSheet"
import { labelToFormValues, type CatalogFormState } from "./shared/form-state"

type LabelType = "input" | "select" | "multiselect"

interface CatalogLabel {
  id: number
  name: string
  key: string
  type: LabelType
  optionCount: number
  entities: string[]
  isSystem: boolean
  raw: LabelRaw
}

function mapLabel(r: LabelRaw): CatalogLabel {
  return {
    id: r.id,
    name: r.name,
    key: r.key,
    type: (r.type as LabelType) ?? "input",
    optionCount: r.options?.length ?? 0,
    entities: r.entity_label?.map((el) => el.entity.name) ?? [],
    isSystem: r.workspace_id === null,
    raw: r,
  }
}

const iconMap: Record<string, React.ElementType> = {
  email:            MailIcon,
  phone:            PhoneIcon,
  address:          MapPinIcon,
  charge:           BriefcaseIcon,
  tag:              TagIcon,
  priority:         ZapIcon,
  lost_reason:      XCircleIcon,
  activity_type:    CalendarIcon,
  tag_opportunity:  LayersIcon,
}

function CatalogCard({ label, onClick }: { label: CatalogLabel; onClick: () => void }) {
  const Icon = iconMap[label.key] ?? TagIcon
  // Nombres largos dejan menos espacio para las etiquetas de entidad — se muestran menos para no romper el layout.
  const maxEntities = label.name.length > 12 ? 1 : 2
  const visibleEntities = label.entities.slice(0, maxEntities)
  const hiddenCount = label.entities.length - visibleEntities.length

  return (
    <Card className="cursor-pointer py-4 transition-shadow hover:shadow-md" onClick={onClick}>
      <CardContent className="flex items-start gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5">
          <Icon className="size-4.5 text-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-baseline justify-between gap-1.5">
            <p className="truncate font-semibold text-sm leading-snug">{label.name}</p>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {label.optionCount} {label.optionCount === 1 ? "opción" : "opciones"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {visibleEntities.map((entity) => (
              <span
                key={entity}
                className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs text-muted-foreground"
              >
                {entity}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                +{hiddenCount}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CatalogCardSkeleton() {
  return (
    <Card className="py-4">
      <CardContent className="flex items-start gap-3 px-4">
        <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}

export function CatalogsGrid() {
  const [labels, setLabels] = React.useState<CatalogLabel[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [activeCatalog, setActiveCatalog] = React.useState<CatalogFormState | undefined>(undefined)
  const [activeIcon, setActiveIcon] = React.useState<React.ElementType | undefined>(undefined)

  function openCatalog(label: CatalogLabel) {
    setActiveCatalog(labelToFormValues(label.raw))
    setActiveIcon(() => iconMap[label.key] ?? TagIcon)
    setSheetOpen(true)
  }

  const fetchLabels = React.useCallback(() => {
    return catalogService.list().then((res) => {
      setLabels(res.data.map(mapLabel))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    fetchLabels()
  }, [fetchLabels])

  // Al cerrar el sheet con cambios, trae solo el catálogo editado (liviano) en vez de
  // recargar los ~100 catálogos completos — se siente instantáneo al cerrar.
  async function refreshOneLabel(labelId: number, key: string) {
    const t0 = Date.now()
    console.log(`[catalog-grid] refresh card start key=${key}`)
    try {
      const [fresh] = await catalogService.getLabelOptions(key)
      console.log(`[catalog-grid] refresh card OK → ${Date.now() - t0}ms`)
      if (!fresh) return
      setLabels((prev) =>
        prev.map((l) =>
          l.id === labelId
            ? { ...l, optionCount: fresh.options.length, raw: { ...l.raw, options: fresh.options } }
            : l
        )
      )
    } catch {
      // silencioso — el conteo se corrige solo en la próxima carga de la página
    }
  }

  const filtered = React.useMemo(
    () =>
      labels.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.entities.some((e) => e.toLowerCase().includes(search.toLowerCase()))
      ),
    [labels, search]
  )

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <Input
          className="pl-9"
          placeholder="Filtrar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CatalogCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Sin resultados.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((label) => (
            <CatalogCard key={label.id} label={label} onClick={() => openCatalog(label)} />
          ))}
        </div>
      )}

      <CatalogOptionsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        catalog={activeCatalog}
        icon={activeIcon}
        onChanged={refreshOneLabel}
      />
    </div>
  )
}
