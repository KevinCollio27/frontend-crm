"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2Icon, UsersIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollDownHint } from "./ScrollDownHint"
import { useScrollHint } from "@/hooks/useScrollHint"
import { cn } from "@/lib/utils"
import { teamService } from "@/services/team.service"
import type { TeamMemberRaw } from "@/types/team"

// Layout de Ref 9 (Upcoming Appointments) con datos reales — mismo criterio de avatar
// que WorkspaceHistoryCard/HistorialTab: imagen real si tiene, si no el placeholder de
// shadcn. Altura fija (h-92, igual que Historial/Calendario — comparten fila) con
// scroll oculto, flecha de "hay más" y "Cargar más" — mismo criterio que el resto.
type Role = "owner" | "admin" | "member"

// Mismo formato de badge que Fuente/Cargo/STATUS_CONFIG en toda la app (border + fondo
// pastel + texto, con su variante dark:) — antes le faltaba el borde.
const ROLE_CONFIG: Record<Role, { label: string; badgeClass: string; barClass: string }> = {
  owner:  { label: "Propietario",   badgeClass: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-400", barClass: "bg-purple-500" },
  admin:  { label: "Administrador", badgeClass: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-400",                   barClass: "bg-sky-500"    },
  member: { label: "Miembro",       badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400", barClass: "bg-emerald-500" },
}

// Propietario primero, luego Administradores, luego Miembros — el backend no ordena por
// rol, así que se ordena acá cada vez que se suma una tanda nueva.
const ROLE_PRIORITY: Record<Role, number> = { owner: 0, admin: 1, member: 2 }

function roleOf(member: TeamMemberRaw): Role {
  if (member.is_owner) return "owner"
  if (member.is_admin) return "admin"
  return "member"
}

function sortByRole(members: TeamMemberRaw[]): TeamMemberRaw[] {
  return [...members].sort((a, b) => ROLE_PRIORITY[roleOf(a)] - ROLE_PRIORITY[roleOf(b)])
}

const TAKE = 8

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
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const { ref: scrollRef, canScrollDown, scrollStep, onScroll } = useScrollHint<HTMLDivElement>([members])

  React.useEffect(() => {
    let cancelled = false
    teamService.list({ page: 1, take: TAKE })
      .then((res) => {
        if (cancelled) return
        setMembers(sortByRole(res.data))
        setHasMore(res.page < res.totalPages)
      })
      .catch(() => { if (!cancelled) setMembers([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function loadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    teamService.list({ page: nextPage, take: TAKE })
      .then((res) => {
        setMembers((prev) => sortByRole([...prev, ...res.data]))
        setHasMore(res.page < res.totalPages)
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

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
          <div className="relative flex-1 overflow-hidden">
            <div ref={scrollRef} onScroll={onScroll} className="h-full divide-y overflow-y-auto scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

              {hasMore && (
                <div className="flex justify-center py-3">
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                    {loadingMore ? "Cargando..." : "Cargar más"}
                  </Button>
                </div>
              )}
            </div>
            <ScrollDownHint visible={canScrollDown} onClick={scrollStep} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
