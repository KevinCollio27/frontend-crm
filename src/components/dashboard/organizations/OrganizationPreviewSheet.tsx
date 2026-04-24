"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  BriefcaseIcon,
  ChevronsUpIcon,
  Eye,
  FileTextIcon,
  InfoIcon,
  TargetIcon,
  Trash2,
  UsersIcon,
  UserPlusIcon,
} from "lucide-react"
import type { Organization } from "./OrganizationsTable"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

const getFlag = (code: string) =>
  code.toUpperCase().split("").map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("")

const countryNames: Record<string, string> = {
  CL: "Chile",
  AR: "Argentina",
  CO: "Colombia",
  PE: "Perú",
  MX: "México",
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
  { icon: UserPlusIcon,  label: "Contacto",     color: "text-violet-500"  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  organization: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrganizationPreviewSheet({ organization, open, onOpenChange }: Props) {
  if (!organization) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:sm:max-w-md">

        {/* Identity */}
        <div className="flex shrink-0 items-center gap-4 border-b px-5 py-4">
          <Avatar className="size-16 shrink-0 border">
            <AvatarImage src="https://github.com/shadcn.png" alt={organization.name} />
            <AvatarFallback className="text-base font-medium">
              {getInitials(organization.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium">
              {organization.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {organization.taxId}
            </span>
            <div className="flex gap-1.5 flex-wrap mt-0.5">
              <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {organization.industry || "Organización"}
              </span>
              <span className={cn(
                "w-fit rounded-full px-2 py-0.5 text-xs font-medium",
                organization.source === "CRM"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-emerald-50 text-emerald-600"
              )}>
                {organization.source}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <SectionHeader icon={ChevronsUpIcon} label="Acciones Rápidas" />
        <div className="shrink-0 px-4 py-3 border-b">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border border-border bg-muted/50 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
              >
                <Icon className={cn("size-4", color)} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto flex flex-col">

          {/* Información */}
          <SectionHeader icon={InfoIcon} label="Información General" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            {organization.website && (
              <InfoRow label="Sitio web">
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {organization.website.replace(/^https?:\/\//, "")}
                </a>
              </InfoRow>
            )}
            <InfoRow label="País">
              {getFlag(organization.country)}{" "}
              {countryNames[organization.country] ?? organization.country}
            </InfoRow>
            <InfoRow label="Fuente">{organization.source}</InfoRow>
            <InfoRow label="Miembro desde">
              {new Date(organization.createdAt).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </InfoRow>
          </div>

          {/* Contactos */}
          <SectionHeader icon={UsersIcon} label="Contactos Asociados" />
          <div className="flex flex-col gap-1.5 px-4 py-3">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
              <Avatar className="size-7 shrink-0">
                <AvatarImage src="https://github.com/shadcn.png" alt="Kevin Collio" />
                <AvatarFallback className="text-[10px] font-medium">KC</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-medium">Kevin Collio</p>
                <p className="text-xs text-muted-foreground">Director ejecutivo</p>
              </div>
              <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
                Alto valor
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <SheetFooter className="flex-col gap-2 border-t px-4 py-3 shrink-0">
          <Button variant="outline" className="w-full justify-start text-xs h-8">
            <Eye className="size-3.5" /> Ver Registro
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-8 bg-red-50 text-red-500 border-red-100 hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="size-3.5" /> Eliminar
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
