"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, DownloadIcon, FileSpreadsheetIcon, PrinterIcon } from "lucide-react"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Col1Info } from "./detail/Col1Info"
import { Col2Tabs } from "./detail/Col2Tabs"
import { Col3Related } from "./detail/Col3Related"
import type { OpportunityDetailData } from "@/types/opportunity"

interface Props {
  data:           OpportunityDetailData
  onStatusChange: (updates: { is_won: boolean; is_lost: boolean }) => void
}

export function FunnelDetail({ data, onStatusChange }: Props) {
  const router     = useRouter()
  const { setOpen } = useSidebar()

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

      {/* 3 columns */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Col 1 */}
        <div className="flex w-[25%] shrink-0 flex-col overflow-y-auto border-r [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Col1Info data={data} />
        </div>

        {/* Col 2 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-r">
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
        <div className="flex w-[25%] shrink-0 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Col3Related data={data} onStatusChange={onStatusChange} />
        </div>
      </div>
    </>
  )
}
