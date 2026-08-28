"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { UsersIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { teamService } from "@/services/team.service"
import type { TeamMemberRaw } from "@/types/team"

// Layout de Ref 9 (Upcoming Appointments) con datos reales — mismo criterio de avatar
// que WorkspaceHistoryCard/HistorialTab: imagen real si tiene, si no el placeholder de
// shadcn. Misma altura fija que Historial/Calendario, mismo mecanismo de scroll interno.
type Role = "owner" | "admin" | "member"

// Mismo formato de badge que Fuente/Cargo/STATUS_CONFIG en toda la app (border + fondo
// pastel + texto, con su variante dark:) — antes le faltaba el borde.
const ROLE_CONFIG: Record<Role, { label: string; badgeClass: string; barClass: string }> = {
  owner:  { label: "Propietario",   badgeClass: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-400", barClass: "bg-purple-500" },
  admin:  { label: "Administrador", badgeClass: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-400",                   barClass: "bg-sky-500"    },
  member: { label: "Miembro",       badgeClass: "border-border bg-muted text-muted-foreground",                                                                        barClass: "bg-muted-foreground/40" },
}

function roleOf(member: TeamMemberRaw): Role {
  if (member.is_owner) return "owner"
  if (member.is_admin) return "admin"
  return "member"
}

function TeamMembersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-1 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TeamMembersCard() {
  const [members, setMembers] = React.useState<TeamMemberRaw[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    teamService.list({ take: 100 })
      .then((res) => { if (!cancelled) setMembers(res.data) })
      .catch(() => { if (!cancelled) setMembers([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <Card className="h-92">
      <CardContent className="flex h-full flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2.5">
          <UsersIcon className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Usuarios</p>
            <p className="text-base font-semibold">Equipo del workspace</p>
          </div>
        </div>

        {loading ? (
          <TeamMembersSkeleton />
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin usuarios en este workspace.</p>
        ) : (
          <div className="flex-1 divide-y overflow-y-auto">
            {members.map((member) => {
              const role = roleOf(member)
              return (
                <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className={cn("h-9 w-1 shrink-0 rounded-full", ROLE_CONFIG[role].barClass)} />
                  <Avatar size="sm" className="shrink-0">
                    <AvatarImage src={member.user.avatar_url ?? "https://github.com/shadcn.png"} alt={member.user.name} />
                    <AvatarFallback className="text-[10px]" />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{member.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(member.created_at), "d MMM yyyy", { locale: es })}
                    </span>
                    <Badge variant="outline" className={cn("rounded-full text-xs", ROLE_CONFIG[role].badgeClass)}>
                      {ROLE_CONFIG[role].label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
