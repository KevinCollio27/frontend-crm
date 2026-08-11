"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  CalendarIcon,
  ChevronsUpIcon,
  EyeIcon,
  FileTextIcon,
  PencilIcon,
  TargetIcon,
  Trash2,
  UsersIcon,
} from "lucide-react"
import { ACTIVITY_TYPE_CONFIG, DEFAULT_TYPE_CONFIG, PRIORITY_CONFIG } from "@/lib/activity-utils"
import { STAGES } from "./data"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityLike {
  title: string
  type: string
  priority: string
  startDate: string
  endDate: string
  stageId: string
  createdAt: string
  responsible: { name: string; initials: string; avatarUrl?: string | null }
  opportunityName?: string
  funnelName?: string
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  pendiente:   { dot: "bg-amber-500",       badge: "bg-amber-500/10 text-amber-600",     label: "Pendiente"   },
  en_progreso: { dot: "bg-blue-500",        badge: "bg-blue-500/10 text-blue-600",       label: "En Progreso" },
  completada:  { dot: "bg-emerald-500",     badge: "bg-emerald-500/10 text-emerald-600", label: "Completada"  },
  cancelada:   { dot: "bg-muted-foreground",badge: "bg-muted text-muted-foreground",     label: "Cancelada"   },
}

const TODAY = new Date().toISOString().slice(0, 10)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })

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
  { icon: FileTextIcon, label: "Nota",       color: "text-blue-500"    },
  { icon: TargetIcon,   label: "Desafío",    color: "text-amber-500"   },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  activity: ActivityLike | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewDetail?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityPreviewSheet({ activity, open, onOpenChange, onViewDetail, onEdit, onDelete }: Props) {
  if (!activity) return null

  const typeConfig   = ACTIVITY_TYPE_CONFIG[activity.type] ?? DEFAULT_TYPE_CONFIG
  const TypeIcon     = typeConfig.icon
  const stageConfig  = STAGE_CONFIG[activity.stageId] ?? STAGE_CONFIG.pendiente
  const priorityConf = PRIORITY_CONFIG[activity.priority] ?? null
  const stageName    = STAGES.find((s) => s.id === activity.stageId)?.name ?? activity.stageId
  const overdue      = activity.stageId !== "completada" && activity.stageId !== "cancelada" && activity.endDate < TODAY

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:sm:max-w-md">

        {/* Identity */}
        <div className="flex shrink-0 items-center gap-4 border-b px-5 py-4">
          <div className={cn("size-14 shrink-0 rounded-xl flex items-center justify-center", typeConfig.bgClass)}>
            <TypeIcon className={cn("size-7", typeConfig.iconClass)} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-sm font-medium leading-snug line-clamp-2">{activity.title}</span>
            <div className="flex gap-1.5 flex-wrap mt-0.5">
              <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {activity.type}
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", stageConfig.badge)}>
                <span className={cn("size-1.5 rounded-full", stageConfig.dot)} />
                {stageName}
              </span>
              {overdue && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  Atrasada
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <SectionHeader icon={ChevronsUpIcon} label="Acciones Rápidas" />
        <div className="shrink-0 px-4 py-3 border-b">
          <div className="grid grid-cols-2 gap-2">
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

          {/* Información */}
          <SectionHeader icon={CalendarIcon} label="Información General" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            <InfoRow label="Tipo">{activity.type}</InfoRow>
            <InfoRow label="Estado">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", stageConfig.badge)}>
                <span className={cn("size-1.5 rounded-full", stageConfig.dot)} />
                {stageName}
              </span>
            </InfoRow>
            {priorityConf && (
              <InfoRow label="Prioridad">
                <span className={cn("inline-flex items-center gap-1 text-xs font-medium", priorityConf.color)}>
                  <priorityConf.icon className="size-3" />
                  {priorityConf.label}
                </span>
              </InfoRow>
            )}
            <InfoRow label="Fecha inicio">{fmtDate(activity.startDate)}</InfoRow>
            <InfoRow label="Fecha límite">
              <span className={cn(overdue && "text-red-600 font-medium")}>
                {fmtDate(activity.endDate)}
                {overdue && " · Atrasada"}
              </span>
            </InfoRow>
            <InfoRow label="Creada el">{fmtDate(activity.createdAt)}</InfoRow>
          </div>

          {/* Responsable */}
          <SectionHeader icon={UsersIcon} label="Responsable" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/50 rounded-lg">
              <Avatar className="size-7 shrink-0">
                <AvatarImage src={activity.responsible.avatarUrl ?? "https://github.com/shadcn.png"} alt={activity.responsible.name} />
                <AvatarFallback className="text-[10px] font-medium">
                  {activity.responsible.initials}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs font-medium">{activity.responsible.name}</p>
            </div>
          </div>

          {/* Oportunidad relacionada */}
          {activity.opportunityName && (
            <>
              <SectionHeader icon={TargetIcon} label="Oportunidad Relacionada" />
              <div className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex flex-col gap-1 px-3 py-2 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium">{activity.opportunityName}</p>
                  {activity.funnelName && (
                    <p className="text-xs text-muted-foreground">{activity.funnelName}</p>
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <SheetFooter className="flex-col gap-2 border-t px-4 py-3 shrink-0">
          <Button variant="outline" className="w-full justify-start text-xs h-8 gap-1.5" onClick={onViewDetail}>
            <EyeIcon className="size-3.5" /> Ver detalle
          </Button>
          <Button className="w-full justify-start text-xs h-8 gap-1.5 bg-[#534AB7] hover:bg-[#4840A0]" onClick={onEdit}>
            <PencilIcon className="size-3.5" /> Editar actividad
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
