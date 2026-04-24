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
import { Card, CardContent, CardHeader } from "@/components/ui/card"

type LabelType = "input" | "select" | "multiselect"

interface CatalogLabel {
  id: number
  name: string
  slug: string
  type: LabelType
  optionCount: number
  entities: string[]
}

const catalogs: CatalogLabel[] = [
  {
    id: 1,
    name: "Correo",
    slug: "email",
    type: "input",
    optionCount: 2,
    entities: ["Contacto"],
  },
  {
    id: 2,
    name: "Teléfono",
    slug: "phone",
    type: "input",
    optionCount: 2,
    entities: ["Contacto"],
  },
  {
    id: 3,
    name: "Dirección",
    slug: "address",
    type: "input",
    optionCount: 7,
    entities: ["Organización"],
  },
  {
    id: 4,
    name: "Cargo",
    slug: "charge",
    type: "select",
    optionCount: 9,
    entities: ["Contacto"],
  },
  {
    id: 5,
    name: "Etiqueta",
    slug: "tag",
    type: "multiselect",
    optionCount: 3,
    entities: ["Contacto", "Organización"],
  },
  {
    id: 6,
    name: "Prioridad",
    slug: "priority",
    type: "select",
    optionCount: 3,
    entities: ["Oportunidad", "Actividad"],
  },
  {
    id: 7,
    name: "Razones de pérdida",
    slug: "lost_reason",
    type: "select",
    optionCount: 5,
    entities: ["Oportunidad"],
  },
  {
    id: 8,
    name: "Tipo de Actividad",
    slug: "activity_type",
    type: "select",
    optionCount: 8,
    entities: ["Actividad"],
  },
  {
    id: 10,
    name: "Etiqueta Oportunidad",
    slug: "tag_opportunity",
    type: "multiselect",
    optionCount: 11,
    entities: ["Oportunidad"],
  },
]

const iconMap: Record<string, React.ElementType> = {
  email: MailIcon,
  phone: PhoneIcon,
  address: MapPinIcon,
  charge: BriefcaseIcon,
  tag: TagIcon,
  priority: ZapIcon,
  lost_reason: XCircleIcon,
  activity_type: CalendarIcon,
  tag_opportunity: LayersIcon,
}

const typeLabel: Record<LabelType, string> = {
  input: "Texto",
  select: "Selección",
  multiselect: "Selección múltiple",
}

function CatalogCard({ label }: { label: CatalogLabel }) {
  const Icon = iconMap[label.slug] ?? TagIcon
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
          <Icon className="size-4.5 text-amber-700" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <p className="font-semibold text-sm leading-snug">{label.name}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {label.optionCount} opciones
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {typeLabel[label.type]}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {label.entities.map((entity) => (
            <span
              key={entity}
              className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs text-muted-foreground"
            >
              {entity}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function CatalogsGrid() {
  const [search, setSearch] = React.useState("")

  const filtered = catalogs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.entities.some((e) => e.toLowerCase().includes(search.toLowerCase()))
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

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Sin resultados.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((label) => (
            <CatalogCard key={label.id} label={label} />
          ))}
        </div>
      )}
    </div>
  )
}
