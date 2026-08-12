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
  Link2,
  PencilIcon,
  TargetIcon,
  Trash2,
  UserIcon,
} from "lucide-react"
import * as React from "react"
import type { Document } from "./DocumentsTable"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileConfig: Record<string, { icon: React.ElementType; iconClass: string; bgClass: string }> = {
  pdf:  { icon: FileTextIcon, iconClass: "text-red-600",    bgClass: "bg-red-50"    },
  png:  { icon: ImageIcon,    iconClass: "text-blue-600",   bgClass: "bg-blue-50"   },
  jpg:  { icon: ImageIcon,    iconClass: "text-blue-600",   bgClass: "bg-blue-50"   },
  jpeg: { icon: ImageIcon,    iconClass: "text-blue-600",   bgClass: "bg-blue-50"   },
  docx: { icon: FileIcon,     iconClass: "text-sky-600",    bgClass: "bg-sky-50"    },
  doc:  { icon: FileIcon,     iconClass: "text-sky-600",    bgClass: "bg-sky-50"    },
  xlsx: { icon: FileIcon,     iconClass: "text-green-600",  bgClass: "bg-green-50"  },
  xls:  { icon: FileIcon,     iconClass: "text-green-600",  bgClass: "bg-green-50"  },
  pptx: { icon: FileIcon,     iconClass: "text-orange-600", bgClass: "bg-orange-50" },
  link: { icon: Link2,        iconClass: "text-violet-600", bgClass: "bg-violet-50" },
}

const fileTypeBadge: Record<string, string> = {
  pdf:  "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  png:  "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  jpg:  "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  jpeg: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  docx: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  doc:  "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  xlsx: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  xls:  "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  pptx: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  ppt:  "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  zip:  "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
  rar:  "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
  link: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
}

const categoryLabels: Record<string, string> = {
  contrato:     "Contrato",
  factura:      "Factura",
  presentacion: "Presentación",
  manual:       "Manual",
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
  { icon: FileTextIcon,  label: "Nota",       color: "text-blue-500"    },
  { icon: TargetIcon,    label: "Desafío",     color: "text-amber-500"   },
  { icon: BriefcaseIcon, label: "Oportunidad", color: "text-emerald-500" },
  { icon: CalendarIcon,  label: "Tarea",       color: "text-violet-500"  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  document: Document | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentPreviewSheet({ document: doc, open, onOpenChange, onDownload, onEdit, onDelete }: Props) {
  if (!doc) return null

  const isLink = doc.fileType === "link"
  const config = fileConfig[doc.fileType] ?? { icon: FileIcon, iconClass: "text-muted-foreground", bgClass: "bg-muted" }
  const FileTypeIcon = config.icon

  function handleOpen() {
    if (isLink) {
      window.open(doc!.filePath, "_blank")
    } else {
      onDownload?.()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full! flex-col gap-0 p-0 data-[side=right]:sm:max-w-md">

        {/* Identity */}
        <div className="flex shrink-0 items-center gap-4 border-b px-5 py-4">
          <div className={cn("size-14 shrink-0 rounded-xl flex items-center justify-center", config.bgClass)}>
            <FileTypeIcon className={cn("size-7", config.iconClass)} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium leading-snug">{doc.name}</span>
            {doc.description && (
              <span className="truncate text-xs text-muted-foreground">{doc.description}</span>
            )}
            <div className="flex gap-1.5 flex-wrap mt-0.5">
              <span className={cn(
                "w-fit rounded px-2 py-0.5 text-xs font-medium uppercase",
                fileTypeBadge[doc.fileType] ?? "bg-muted text-muted-foreground"
              )}>
                {doc.fileType}
              </span>
              {doc.category && (
                <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {categoryLabels[doc.category] ?? doc.category}
                </span>
              )}
              <span className={cn(
                "w-fit rounded-full px-2 py-0.5 text-xs font-medium",
                doc.visibility === "public"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              )}>
                {doc.visibility === "public" ? "Público" : "Privado"}
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
              <span className={cn(
                "rounded px-2 py-0.5 text-xs font-medium uppercase",
                fileTypeBadge[doc.fileType] ?? "bg-muted text-muted-foreground"
              )}>
                {doc.fileType}
              </span>
            </InfoRow>
            {doc.fileSize && (
              <InfoRow label="Tamaño">{formatSize(doc.fileSize)}</InfoRow>
            )}
            {doc.category && (
              <InfoRow label="Categoría">{categoryLabels[doc.category] ?? doc.category}</InfoRow>
            )}
            <InfoRow label="Visibilidad">
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                doc.visibility === "public"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              )}>
                {doc.visibility === "public" ? "Público" : "Privado"}
              </span>
            </InfoRow>
            {doc.uploadedBy && (
              <InfoRow label="Subido por">
                <span className="flex items-center gap-1">
                  <UserIcon className="size-3 text-muted-foreground" />
                  {doc.uploadedBy}
                </span>
              </InfoRow>
            )}
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
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-8 gap-1.5"
            onClick={handleOpen}
          >
            <ExternalLinkIcon className="size-3.5" />
            {isLink ? "Abrir enlace" : "Ver archivo"}
          </Button>
          {!isLink && (
            <Button
              className="w-full justify-start text-xs h-8 gap-1.5 bg-[#534AB7] hover:bg-[#4840A0]"
              onClick={onDownload}
            >
              <DownloadIcon className="size-3.5" /> Descargar
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-8 gap-1.5"
            onClick={onEdit}
          >
            <PencilIcon className="size-3.5" /> Editar
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-8 gap-1.5 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" /> Eliminar
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
