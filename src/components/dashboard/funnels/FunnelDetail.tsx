"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, ClipboardListIcon, DownloadIcon, FileSpreadsheetIcon, PrinterIcon, UserIcon, WalletIcon } from "lucide-react"
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
import type { OpportunityDetailData } from "@/types/opportunity"

// ─── Mobile — selector de columna (mismo patrón que Contactos/Organizaciones/Actividades > Detalle) ──

type MobileDetailView = "info" | "detalle" | "resumen"

const DETAIL_VIEW_OPTIONS: { value: MobileDetailView; label: string; icon: React.ElementType }[] = [
  { value: "info",    label: "Info",    icon: UserIcon         },
  { value: "detalle", label: "Detalle", icon: ClipboardListIcon },
  { value: "resumen", label: "Resumen", icon: WalletIcon       },
]

interface Props {
  data:           OpportunityDetailData
  onStatusChange: (updates: { is_won: boolean; is_lost: boolean }) => void
}

export function FunnelDetail({ data, onStatusChange }: Props) {
  const router     = useRouter()
  const { setOpen } = useSidebar()
  const [mobileView, setMobileView] = React.useState<MobileDetailView>("detalle")

  React.useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, [])

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
            <Link href="/crm/funnels" className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Oportunidades
            </Link>
            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-medium">{data.name}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" />}>
            Acciones <ChevronDownIcon className="ml-1 size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem><PrinterIcon /> Imprimir</DropdownMenuItem>
            <DropdownMenuItem><DownloadIcon /> Exportar PDF</DropdownMenuItem>
            <DropdownMenuItem><FileSpreadsheetIcon /> Exportar Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

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
          <Col1Info data={data} />
        </div>

        {/* Col 2 */}
        <div className={cn(
          "min-h-0 flex-1 flex-col overflow-hidden border-r md:flex",
          mobileView === "detalle" ? "flex" : "hidden md:flex"
        )}>
          <Col2Tabs
            opportunityId={data.id}
            opportunityName={data.name}
            flowName={data.flow?.name ?? null}
            contactName={data.person?.name ?? null}
            contactEmail={data.person_email}
            contactPhone={data.person_phone}
          />
        </div>

        {/* Col 3 */}
        <div className={cn(
          "w-full shrink-0 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex md:w-[25%]",
          mobileView === "resumen" ? "flex" : "hidden md:flex"
        )}>
          <Col3Related data={data} onStatusChange={onStatusChange} />
        </div>
      </div>
    </>
  )
}
