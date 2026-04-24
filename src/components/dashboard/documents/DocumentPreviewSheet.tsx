"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  BriefcaseIcon,
  CalendarIcon,
  ChevronsUpIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  InfoIcon,
  TargetIcon,
  Trash2,
} from "lucide-react"
import type { Document } from "./DocumentsTable"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileConfig: Record<string, { icon: React.ElementType; iconClass: string; bgClass: string }> = {
  pdf:  { icon: FileTextIcon, iconClass: "text-red-600",   bgClass: "bg-red-50"   },
  png:  { icon: ImageIcon,    iconClass: "text-blue-600",  bgClass: "bg-blue-50"  },
  jpg:  { icon: ImageIcon,    iconClass: "text-blue-600",  bgClass: "bg-blue-50"  },
  docx: { icon: FileIcon,     iconClass: "text-sky-600",   bgClass: "bg-sky-50"   },
  xlsx: { icon: FileIcon,     iconClass: "text-green-600", bgClass: "bg-green-50" },
}

const extensionBadge: Record<string, string> = {
  pdf:  "bg-red-50 text-red-600",
  png:  "bg-blue-50 text-blue-600",
  jpg:  "bg-blue-50 text-blue-600",
  docx: "bg-sky-50 text-sky-600",
  xlsx: "bg-green-50 text-green-600",
}

const categoryLabel: Record<string, string> = {
  presentacion: "Presentación",
  contrato:     "Contrato",
  informe:      "Informe",
  otro:         "Otro",
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-y bg-muted/30">
      <Icon className="size-3.5 text-blue-500" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const quickActions = [
  { icon: FileTextIcon,  label: "Nota",        color: "text-blue-500"    },
  { icon: TargetIcon,    label: "Desafío",      color: "text-amber-500"   },
  { icon: BriefcaseIcon, label: "Oportunidad",  color: "text-emerald-500" },
  { icon: CalendarIcon,  label: "Tarea",        color: "text-violet-500"  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  document: Document | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentPreviewSheet({ document: doc, open, onOpenChange }: Props) {
  if (!doc) return null

  const config = fileConfig[doc.extension] ?? { icon: FileIcon, iconClass: "text-muted-foreground", bgClass: "bg-muted" }
  const FileIcon_ = config.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:sm:max-w-md">

        {/* Identity */}
        <div className="flex shrink-0 items-center gap-4 border-b px-5 py-4">
          <div className={cn("size-14 shrink-0 rounded-xl flex items-center justify-center", config.bgClass)}>
            <FileIcon_ className={cn("size-7", config.iconClass)} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium leading-snug">{doc.name}</span>
            {doc.description && (
              <span className="truncate text-xs text-muted-foreground">{doc.description}</span>
            )}
            <div className="flex gap-1.5 flex-wrap mt-0.5">
              <span className={cn("w-fit rounded px-2 py-0.5 text-xs font-medium uppercase", extensionBadge[doc.extension] ?? "bg-muted text-muted-foreground")}>
                {doc.extension}
              </span>
              <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {categoryLabel[doc.category] ?? doc.category}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <SectionHeader icon={ChevronsUpIcon} label="Acciones Rápidas" />
        <div className="shrink-0 px-4 py-3 border-b">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(({ icon: ActionIcon, label, color }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border border-border bg-muted/50 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
              >
                <ActionIcon className={cn("size-4", color)} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto flex flex-col">

          <SectionHeader icon={InfoIcon} label="Información General" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            <InfoRow label="Tipo">
              <span className={cn("rounded px-2 py-0.5 text-xs font-medium uppercase", extensionBadge[doc.extension] ?? "bg-muted text-muted-foreground")}>
                {doc.extension}
              </span>
            </InfoRow>
            <InfoRow label="Tamaño">{formatSize(doc.size)}</InfoRow>
            <InfoRow label="Categoría">{categoryLabel[doc.category] ?? doc.category}</InfoRow>
            <InfoRow label="Subido el">
              {new Date(doc.createdAt).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </InfoRow>
          </div>

        </div>

        {/* Footer */}
        <SheetFooter className="flex-col gap-2 border-t px-4 py-3 shrink-0">
          <Button variant="outline" className="w-full justify-start text-xs h-8 gap-1.5">
            <ExternalLinkIcon className="size-3.5" /> Ver archivo
          </Button>
          <Button className="w-full justify-start text-xs h-8 gap-1.5 bg-[#534AB7] hover:bg-[#4840A0]">
            <DownloadIcon className="size-3.5" /> Descargar
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-8 gap-1.5 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-3.5" /> Eliminar
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
