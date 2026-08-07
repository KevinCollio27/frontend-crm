"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDownIcon, PlusIcon, ShieldIcon } from "lucide-react"
import { useSessionStore } from "@/store/session.store"
import { saveLastWorkspace } from "@/lib/workspace-pref"
import { flowService } from "@/services/flow.service"
import { workspaceService, type PlatformAdminWorkspaceOverview } from "@/services/workspace.service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { UserWorkspace } from "@/types/auth"
import { WorkspaceLogo } from "@/components/shared/WorkspaceLogo"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  const workspaceId = useSessionStore((s) => s.workspaceId)
  const isLoading = useSessionStore((s) => s.isLoading)
  const isPlatformAdmin = useSessionStore((s) => s.isPlatformAdmin)
  const platformAdminViewing = useSessionStore((s) => s.platformAdminViewing)

  const [allWorkspaces, setAllWorkspaces] = React.useState<PlatformAdminWorkspaceOverview[] | null>(null)
  const [enteringId, setEnteringId] = React.useState<number | null>(null)

  const workspaces: UserWorkspace[] = user?.user_workspace ?? []
  const ownWorkspaceIds = new Set(workspaces.map((w) => w.workspace_id))
  const active = workspaces.find((w) => w.workspace_id === workspaceId) ?? workspaces[0]

  // Solo se pide una vez que se abre el menú, y solo si es admin de plataforma —
  // un usuario normal nunca dispara este request.
  function handleOpenChange(open: boolean) {
    if (open && isPlatformAdmin && allWorkspaces === null) {
      workspaceService.getPlatformAdminOverview().then(setAllWorkspaces).catch(() => setAllWorkspaces([]))
    }
  }

  if (isLoading || (!active && !platformAdminViewing)) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="size-8 shrink-0 rounded-lg bg-muted animate-pulse" />
            <div className="grid flex-1 gap-1">
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const handleSwitch = async (ws: UserWorkspace) => {
    if (ws.workspace_id === workspaceId) return
    await fetch("/api/auth/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: ws.workspace_id }),
    })
    if (user) saveLastWorkspace(user.id, ws.workspace_id)
    flowService.invalidateCache()
    useSessionStore.getState().setSession(user!, ws.workspace_id)
  }

  const handleEnterForeign = async (ws: PlatformAdminWorkspaceOverview) => {
    if (ws.id === workspaceId) return
    setEnteringId(ws.id)
    await fetch("/api/auth/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: ws.id }),
    })
    flowService.invalidateCache()
    useSessionStore.getState().enterAsPlatformAdmin({ id: ws.id, name: ws.name })
    setEnteringId(null)
  }

  const activeName = platformAdminViewing?.name ?? active?.workspace?.name ?? "Workspace"
  const activeLogo = platformAdminViewing ? undefined : active?.workspace?.logo
  const foreignWorkspaces = (allWorkspaces ?? []).filter((w) => !ownWorkspaceIds.has(w.id))

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <WorkspaceLogo name={activeName} logo={activeLogo} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {platformAdminViewing ? "Admin — ajeno" : "Workspace"}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Espacios de Trabajo
              </DropdownMenuLabel>
              <div className="max-h-64 overflow-y-auto">
                {workspaces.map((ws) => {
                  const wsName = ws.workspace?.name ?? `Workspace ${ws.workspace_id}`
                  const isActive = ws.workspace_id === workspaceId && !platformAdminViewing
                  return (
                    <DropdownMenuItem
                      key={ws.workspace_id}
                      onClick={() => handleSwitch(ws)}
                      className="gap-2 p-2"
                    >
                      <WorkspaceLogo name={wsName} logo={ws.workspace?.logo} size="sm" />
                      <span className={isActive ? "font-medium" : ""}>{wsName}</span>
                      {isActive && (
                        <span className="ml-auto size-1.5 rounded-full bg-foreground" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </div>
            </DropdownMenuGroup>

            {isPlatformAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldIcon className="size-3" />
                    Todos los workspaces (admin)
                  </DropdownMenuLabel>
                  <div className="max-h-64 overflow-y-auto">
                    {allWorkspaces === null ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">Cargando...</div>
                    ) : foreignWorkspaces.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No hay otros workspaces.</div>
                    ) : (
                      foreignWorkspaces.map((ws) => {
                        const isActive = ws.id === workspaceId && !!platformAdminViewing
                        return (
                          <DropdownMenuItem
                            key={ws.id}
                            onClick={() => handleEnterForeign(ws)}
                            disabled={enteringId !== null}
                            className="gap-2 p-2"
                          >
                            <WorkspaceLogo name={ws.name} size="sm" />
                            <span className={isActive ? "font-medium" : ""}>{ws.name}</span>
                            {enteringId === ws.id && (
                              <span className="ml-auto text-xs text-muted-foreground">Entrando...</span>
                            )}
                            {isActive && (
                              <span className="ml-auto size-1.5 rounded-full bg-foreground" />
                            )}
                          </DropdownMenuItem>
                        )
                      })
                    )}
                  </div>
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => router.push("/create-workspace")}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-muted">
                <PlusIcon className="size-3.5" />
              </div>
              <span className="text-muted-foreground">Crear workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
