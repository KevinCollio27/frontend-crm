"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  PencilIcon,
  PrinterIcon,
  UserIcon,
  WalletIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Col1Info } from "./detail/Col1Info"
import { Col2Tabs } from "./detail/Col2Tabs"
import { Col3Related } from "./detail/Col3Related"
import { CreateContactSheet } from "./CreateContactSheet"
import { contactService } from "@/services/contact.service"
import { teamService } from "@/services/team.service"
import { prefetchHistorial } from "./detail/tabs/HistorialTab"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import type { ContactDetailData } from "@/types/contact"

// ─── Mobile — selector de columna (3 columnas no caben en un celular, se ve
// una a la vez; "detalle" es la que abre por default porque es el contenido
// principal — historial/oportunidades/etc.) ────────────────────────────────

type MobileDetailView = "info" | "detalle" | "resumen"

const DETAIL_VIEW_OPTIONS: { value: MobileDetailView; label: string; icon: React.ElementType }[] = [
  { value: "info",    label: "Info",    icon: UserIcon         },
  { value: "detalle", label: "Detalle", icon: ClipboardListIcon },
  { value: "resumen", label: "Resumen", icon: WalletIcon       },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Col1Skeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm p-3.5">
        <div className="flex items-center gap-3">
          <div className="size-12 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 py-3">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="border-t divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Col3Skeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5 space-y-2">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-8 w-36 animate-pulse rounded bg-muted" />
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-3 divide-x border-t">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-3">
              <div className="h-5 w-8 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Map helper ───────────────────────────────────────────────────────────────

function mapToDetailData(
  person: Awaited<ReturnType<typeof contactService.getById>>,
  teamMembers: Awaited<ReturnType<typeof teamService.list>>["data"],
): ContactDetailData {
  const email = person.person_detail?.find((d) => d.label?.key === "email")?.value ?? null
  const phone = person.person_detail?.find((d) => d.label?.key === "phone")?.value ?? null

  const ownerMember = person.owner_user_id
    ? teamMembers.find((m) => m.user_id === person.owner_user_id)
    : null

  return {
    id:               person.id,
    name:             person.name,
    internal_position: person.internal_position,
    birth_date:       person.birth_date,
    country_code:     person.pais_origen ?? "CL",
    contact_source:   person.contact_source,
    origin:           person.origin,
    created_at:       new Date(person.created_at).toLocaleDateString("es-CL", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }),
    linkedin_url:     person.linkedin_url,
    instagram_url:    person.instagram_url,
    twitter_url:      person.twitter_url,
    facebook_url:     person.facebook_url,
    owner:            ownerMember
      ? { id: ownerMember.user_id, name: ownerMember.user?.name ?? ownerMember.user?.email ?? "—" }
      : null,
    organization:     person.organization
      ? {
          id:       person.organization.id,
          name:     person.organization.name,
          industry: person.organization.industry,
          taxId:    person.organization.document_number,
          website:  person.organization.web_page,
        }
      : null,
    email,
    phone,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  id: number
}

export function ContactDetail({ id }: Props) {
  const router          = useRouter()
  const { setOpen }     = useSidebar()
  const [data, setData]       = React.useState<ContactDetailData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [editOpen, setEditOpen] = React.useState(false)
  const [mobileView, setMobileView] = React.useState<MobileDetailView>("detalle")

  // Tiempo real, nivel 2: alguien más edita/elimina ESTE contacto mientras lo
  // estás viendo. Filtra por id (a diferencia de la tabla, acá solo importa
  // el registro abierto) — si lo borraron, te saca de la página en vez de
  // dejarte viendo un detalle fantasma.
  useEntityRealtime("contact", (payload) => {
    const changedId = (payload.data as { id?: number })?.id
    if (changedId !== id) return
    if (payload.action === "deleted") {
      router.push("/crm/contacts")
      return
    }
    setRefreshKey((k) => k + 1)
  })

  React.useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const t0 = Date.now()
    console.log(`[contact-detail] start id=${id}`)

    prefetchHistorial(id)

    Promise.all([
      contactService.getById(id),
      teamService.list({ take: 100 }),
    ])
      .then(([person, team]) => {
        if (cancelled) return
        console.log(`[contact-detail] col1+col3 listos → ${Date.now() - t0}ms`)
        setData(mapToDetailData(person, team.data))
      })
      .catch(() => { if (!cancelled) router.replace("/crm/contacts") })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id, refreshKey])

  return (
    <>
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="shrink-0" />
          <Separator
            orientation="vertical"
            className="data-vertical:h-4 data-vertical:self-auto shrink-0"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="flex items-center gap-1 min-w-0 text-sm">
            <Link
              href="/crm/contacts"
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Contactos
            </Link>
            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-medium">
              {loading ? (
                <span className="inline-block h-3 w-24 animate-pulse rounded bg-muted align-middle" />
              ) : (
                data?.name ?? "—"
              )}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" />}
          >
            Acciones <ChevronDownIcon className="ml-1 size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => setEditOpen(true)}><PencilIcon /> Editar</DropdownMenuItem>
            <DropdownMenuItem><PrinterIcon /> Imprimir</DropdownMenuItem>
            <DropdownMenuItem><DownloadIcon /> Exportar PDF</DropdownMenuItem>
            <DropdownMenuItem><FileSpreadsheetIcon /> Exportar Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {editOpen && (
        <CreateContactSheet
          open
          onOpenChange={setEditOpen}
          contactId={id}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {/* Selector de columna — mobile only, las 3 columnas no caben en un celular */}
      <div className="flex shrink-0 items-center border-b px-4 py-2 md:hidden">
        <Select value={mobileView} onValueChange={(v) => setMobileView(v as MobileDetailView)}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Vista">
              {(v: MobileDetailView) => {
                const opt = DETAIL_VIEW_OPTIONS.find((o) => o.value === v)
                if (!opt) return v
                return (
                  <span className="flex items-center gap-1.5">
                    <opt.icon className="size-3.5" />
                    {opt.label}
                  </span>
                )
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DETAIL_VIEW_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <opt.icon className="size-3.5" />
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3 columns */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Col 1 */}
        <div className={cn(
          "w-full shrink-0 flex-col overflow-y-auto border-r [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex md:w-[25%]",
          mobileView === "info" ? "flex" : "hidden md:flex"
        )}>
          {loading || !data ? <Col1Skeleton /> : <Col1Info data={data} />}
        </div>

        {/* Col 2 */}
        <div className={cn(
          "min-h-0 flex-1 flex-col overflow-hidden border-r md:flex",
          mobileView === "detalle" ? "flex" : "hidden md:flex"
        )}>
          <Col2Tabs contactId={id} contactName={data?.name ?? null} contactEmail={data?.email ?? null} contactPhone={data?.phone ?? null} />
        </div>

        {/* Col 3 */}
        <div className={cn(
          "w-full shrink-0 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex md:w-[25%]",
          mobileView === "resumen" ? "flex" : "hidden md:flex"
        )}>
          {loading || !data ? <Col3Skeleton /> : <Col3Related data={data} />}
        </div>
      </div>
    </>
  )
}
