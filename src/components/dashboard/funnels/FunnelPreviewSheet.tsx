"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BuildingIcon,
  CalendarIcon,
  ClipboardListIcon,
  EyeIcon,
  FileTextIcon,
  MinusIcon,
  PencilIcon,
  TargetIcon,
  Trash2,
  TrendingUpIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"
// ─── Types ────────────────────────────────────────────────────────────────────

interface DealLike {
  name: string
  status: string
  stageName?: string
  stageId?: number | string | null
  company: string
  contact: string
  value: number
  currency?: string
  closeDate: string | null
  responsible: { name: string; initials: string; avatarUrl?: string | null }
  priority?: string
  quotationCount?: number
  activityCount?: number
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  alta:  { icon: ArrowUpIcon,   label: "Alta",  color: "text-red-600"          },
  media: { icon: MinusIcon,     label: "Media", color: "text-yellow-600"        },
  baja:  { icon: ArrowDownIcon, label: "Baja",  color: "text-muted-foreground" },
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  open:        { label: "Abierta",     badge: "bg-blue-500/10 text-blue-600",       dot: "bg-blue-500"     },
  won:         { label: "Ganada",      badge: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500"  },
  lost:        { label: "Perdida",     badge: "bg-red-500/10 text-red-600",         dot: "bg-red-500"      },
  en_progreso: { label: "En Progreso", badge: "bg-blue-500/10 text-blue-600",       dot: "bg-blue-500"     },
  ganada:      { label: "Ganada",      badge: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500"  },
  perdida:     { label: "Perdida",     badge: "bg-red-500/10 text-red-600",         dot: "bg-red-500"      },
  reabierta:   { label: "Reabierta",   badge: "bg-amber-500/10 text-amber-600",     dot: "bg-amber-500"    },
}

function formatValue(value: number, symbol = "$") {
  if (value === 0) return "—"
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${symbol}${(value / 1_000).toFixed(0)}K`
  return `${symbol}${value.toLocaleString("es-CL")}`
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
  { icon: FileTextIcon,    label: "Nota",        color: "text-blue-500"    },
  { icon: ZapIcon,         label: "Desafío",     color: "text-amber-500"   },
  { icon: TargetIcon,      label: "Oportunidad", color: "text-violet-500"  },
  { icon: ClipboardListIcon, label: "Tarea",     color: "text-emerald-500" },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  deal: DealLike | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FunnelPreviewSheet({ deal, open, onOpenChange }: Props) {
  if (!deal) return null

  const statusConf   = STATUS_CONFIG[deal.status] ?? STATUS_CONFIG.en_progreso
  const priorityConf = deal.priority ? PRIORITY_CONFIG[deal.priority] : null
  const PriorityIcon = priorityConf?.icon
  const stageName    = deal.stageName ?? "—"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:sm:max-w-md">

        {/* Identity */}
        <div className="flex shrink-0 items-center gap-4 border-b px-5 py-4">
          <div className="size-14 shrink-0 rounded-xl flex items-center justify-center bg-violet-50">
            <TrendingUpIcon className="size-7 text-violet-600" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-sm font-medium leading-snug line-clamp-2">{deal.name}</span>
            <div className="text-xs text-muted-foreground truncate">
              {deal.company} · {deal.contact}
            </div>
            <div className="flex gap-1.5 flex-wrap mt-0.5">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", statusConf.badge)}>
                <span className={cn("size-1.5 rounded-full", statusConf.dot)} />
                {statusConf.label}
              </span>
              {priorityConf && PriorityIcon && (
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted", priorityConf.color)}>
                  <PriorityIcon className="size-3" />
                  {priorityConf.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <SectionHeader icon={ZapIcon} label="Acciones Rápidas" />
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

          {/* Información General */}
          <SectionHeader icon={TrendingUpIcon} label="Información General" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            <InfoRow label="Valor">
              <span className={cn("font-semibold", deal.value > 0 ? "text-primary" : "text-muted-foreground")}>
                {formatValue(deal.value, deal.currency)}
              </span>
            </InfoRow>
            <InfoRow label="Etapa">{stageName}</InfoRow>
            <InfoRow label="Estado">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", statusConf.badge)}>
                <span className={cn("size-1.5 rounded-full", statusConf.dot)} />
                {statusConf.label}
              </span>
            </InfoRow>
            {priorityConf && PriorityIcon && (
              <InfoRow label="Prioridad">
                <span className={cn("inline-flex items-center gap-1 text-xs font-medium", priorityConf.color)}>
                  <PriorityIcon className="size-3" />
                  {priorityConf.label}
                </span>
              </InfoRow>
            )}
            <InfoRow label="Fecha cierre">
              {deal.closeDate ? (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                  {deal.closeDate}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </InfoRow>
          </div>

          {/* Empresa y Contacto */}
          <SectionHeader icon={BuildingIcon} label="Empresa y Contacto" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            <InfoRow label="Empresa">{deal.company}</InfoRow>
            <InfoRow label="Contacto">{deal.contact}</InfoRow>
          </div>

          {/* Métricas — solo si el dato está disponible */}
          {(deal.quotationCount != null || deal.activityCount != null) && (
            <>
              <SectionHeader icon={ClipboardListIcon} label="Métricas" />
              <div className="flex flex-col gap-1.5 px-4 py-3">
                {deal.quotationCount != null && (
                  <InfoRow label="Cotizaciones">
                    <span className="font-medium">{deal.quotationCount}</span>
                  </InfoRow>
                )}
                {deal.activityCount != null && (
                  <InfoRow label="Actividades">
                    <span className="font-medium">{deal.activityCount}</span>
                  </InfoRow>
                )}
              </div>
            </>
          )}

          {/* Responsable */}
          <SectionHeader icon={UsersIcon} label="Responsable" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/50 rounded-lg">
              <Avatar className="size-7 shrink-0">
                <AvatarImage src={deal.responsible.avatarUrl ?? "https://github.com/shadcn.png"} alt={deal.responsible.name} />
                <AvatarFallback className="text-[10px] font-medium">
                  {deal.responsible.initials}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs font-medium">{deal.responsible.name}</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <SheetFooter className="flex-col gap-2 border-t px-4 py-3 shrink-0">
          <Button variant="outline" className="w-full justify-start text-xs h-8 gap-1.5">
            <EyeIcon className="size-3.5" /> Ver oportunidad
          </Button>
          <Button className="w-full justify-start text-xs h-8 gap-1.5 bg-[#534AB7] hover:bg-[#4840A0]">
            <PencilIcon className="size-3.5" /> Editar oportunidad
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
