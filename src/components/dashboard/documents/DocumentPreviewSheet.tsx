"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CategoryBadge } from "@/components/ui/category-badge"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/table-utils"
import {
  BriefcaseIcon,
  CalendarIcon,
  ChevronsUpIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  InfoIcon,
  PencilIcon,
  TargetIcon,
  Trash2,
} from "lucide-react"
import * as React from "react"
import type { Document } from "./DocumentsTable"
import { DEFAULT_FILE_TYPE_CONFIG, FILE_TYPE_CONFIG } from "./shared/file-type"
import { CATEGORY_LABEL } from "./shared/category"
import { VISIBILITY_CONFIG } from "./shared/visibility"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const config = FILE_TYPE_CONFIG[doc.fileType] ?? DEFAULT_FILE_TYPE_CONFIG
  const FileTypeIcon = config.icon
  const visibilityConf = VISIBILITY_CONFIG[doc.visibility] ?? VISIBILITY_CONFIG.private

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
              <span className="w-fit rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground uppercase">
                {doc.fileType}
              </span>
              {doc.category && (
                <CategoryBadge category={CATEGORY_LABEL[doc.category] ?? doc.category} />
              )}
              <span className={cn("w-fit rounded-full border px-2 py-0.5 text-xs font-medium", visibilityConf.className)}>
                {visibilityConf.label}
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
              <span className="uppercase text-muted-foreground">{doc.fileType}</span>
            </InfoRow>
            {doc.fileSize && (
              <InfoRow label="Tamaño">{formatSize(doc.fileSize)}</InfoRow>
            )}
            {doc.category && (
              <InfoRow label="Categoría">
                <CategoryBadge category={CATEGORY_LABEL[doc.category] ?? doc.category} />
              </InfoRow>
            )}
            <InfoRow label="Visibilidad">
              <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", visibilityConf.className)}>
                {visibilityConf.label}
              </span>
            </InfoRow>
            {doc.uploadedBy && (
              <InfoRow label="Subido por">
                <span className="flex items-center gap-1.5">
                  <Avatar className="size-5 shrink-0">
                    <AvatarImage src={doc.uploadedBy.avatarUrl ?? "https://github.com/shadcn.png"} alt={doc.uploadedBy.name} />
                    <AvatarFallback className="text-[9px] font-semibold">{getInitials(doc.uploadedBy.name)}</AvatarFallback>
                  </Avatar>
                  {doc.uploadedBy.name}
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
