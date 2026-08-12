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
import { useEntityRealtime } from "@/hooks/useEntityRealtime"
import { Col1Info } from "./detail/Col1Info"
import { Col2Tabs } from "./detail/Col2Tabs"
import { Col3Related } from "./detail/Col3Related"
import { CreateOrganizationSheet } from "./CreateOrganizationSheet"
import { organizationService } from "@/services/organization.service"
import { teamService } from "@/services/team.service"
import { prefetchHistorial } from "./detail/tabs/HistorialTab"
import type { OrgDetailData } from "@/types/organization"

// ─── Mobile — selector de columna (mismo patrón que Contactos > Detalle) ───────

type MobileDetailView = "info" | "detalle" | "resumen"

const DETAIL_VIEW_OPTIONS: { value: MobileDetailView; label: string; icon: React.ElementType }[] = [
  { value: "info",    label: "Info",    icon: UserIcon         },
  { value: "detalle", label: "Detalle", icon: ClipboardListIcon },
  { value: "resumen", label: "Resumen", icon: WalletIcon       },
]

// ─── Skeletons ────────────────────────────────────────────────────────────────

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
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="border-t divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-3 w-28 animate-pulse rounded bg-muted" />
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
        <div className="grid grid-cols-2 divide-x border-t">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-3">
              <div className="h-5 w-8 animate-pulse rounded bg-muted" />
              <div className="h-3 w-14 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  id: number
}

export function OrganizationDetail({ id }: Props) {
  const router          = useRouter()
  const { setOpen }     = useSidebar()
  const [data, setData]         = React.useState<OrgDetailData | null>(null)
  const [loading, setLoading]   = React.useState(true)
  const [editOpen, setEditOpen] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [mobileView, setMobileView] = React.useState<MobileDetailView>("detalle")

  // Tiempo real, nivel 2: alguien más edita/elimina ESTA organización mientras
  // la estás viendo. Filtra por id (a diferencia de la tabla, acá solo importa
  // el registro abierto) — si la borraron, te saca de la página en vez de
  // dejarte viendo un detalle fantasma.
  useEntityRealtime("organization", (payload) => {
    const changedId = (payload.data as { id?: number })?.id
    if (changedId !== id) return
    if (payload.action === "deleted") {
      router.push("/crm/organizations")
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
    console.log(`[org-detail] start id=${id}`)

    prefetchHistorial(id)

    Promise.all([
      organizationService.getById(id),
      teamService.list({ take: 100 }),
    ])
      .then(([raw, team]) => {
        if (cancelled) return
        console.log(`[org-detail] col1+col3 listos → ${Date.now() - t0}ms`)
        const member = raw.owner_user_id
          ? team.data.find((m) => m.user_id === raw.owner_user_id)
          : null
        setData({
          id:               raw.id,
          name:             raw.name,
          document_number:  raw.document_number,
          web_page:         raw.web_page,
          industry:         raw.industry,
          pais_origen:      raw.pais_origen,
          origin:           raw.origin,
          contact_source:   raw.contact_source,
          created_at:       raw.created_at,
          linkedin_url:     raw.linkedin_url,
          instagram_url:    raw.instagram_url,
          twitter_url:      raw.twitter_url,
          facebook_url:     raw.facebook_url,
          owner:            member ? { id: member.user_id, name: member.user.name, avatarUrl: member.user.avatar_url ?? null } : null,
          contacts:         raw.person ?? [],
        })
      })
      .catch(() => { if (!cancelled) router.push("/crm/organizations") })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id, router, refreshKey])

  return (
    <>
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="shrink-0" />
          <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto shrink-0" />
          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => router.back()}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="flex items-center gap-1 min-w-0 text-sm">
            <Link href="/crm/organizations" className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Organizaciones
            </Link>
            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
            {loading
              ? <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              : <span className="truncate text-xs font-medium">{data?.name ?? ""}</span>
            }
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" />}>
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
        <CreateOrganizationSheet
          open
          onOpenChange={setEditOpen}
          organizationId={id}
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
        <div className={cn(
          "w-full shrink-0 flex-col overflow-y-auto border-r [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex md:w-[25%]",
          mobileView === "info" ? "flex" : "hidden md:flex"
        )}>
          {loading || !data ? <Col1Skeleton /> : <Col1Info data={data} />}
        </div>
        <div className={cn(
          "min-h-0 flex-1 flex-col overflow-hidden border-r md:flex",
          mobileView === "detalle" ? "flex" : "hidden md:flex"
        )}>
          <Col2Tabs orgId={id} orgName={data?.name ?? ""} />
        </div>
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
