"use client"

import { useRouter } from "next/navigation"
import { ChevronsUpDownIcon } from "lucide-react"
import { useSessionStore } from "@/store/session.store"
import { saveLastWorkspace } from "@/lib/workspace-pref"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { UserWorkspace } from "@/types/auth"

function WorkspaceLogo({ name, logo, size = "md" }: { name: string; logo?: string | null; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "size-8" : "size-6"
  const textClass = size === "md" ? "text-sm" : "text-xs"
  if (logo) {
    return (
      <div className={`${sizeClass} shrink-0 flex items-center justify-center rounded-lg bg-white`}>
        <img src={logo} alt={name} className="size-full object-contain" />
      </div>
    )
  }
  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-semibold ${textClass}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  const workspaceId = useSessionStore((s) => s.workspaceId)

  const workspaces: UserWorkspace[] = user?.user_workspace ?? []
  const active = workspaces.find((w) => w.workspace_id === workspaceId) ?? workspaces[0]

  if (!active) return null

  const handleSwitch = async (ws: UserWorkspace) => {
    if (ws.workspace_id === workspaceId) return
    await fetch("/api/auth/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: ws.workspace_id }),
    })
    if (user) saveLastWorkspace(user.id, ws.workspace_id)
    useSessionStore.getState().setSession(user!, ws.workspace_id)
    router.refresh()
  }

  const activeName = active.workspace?.name ?? "Workspace"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <WorkspaceLogo name={activeName} logo={active.workspace?.logo} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeName}</span>
              <span className="truncate text-xs text-muted-foreground">Workspace</span>
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
              {workspaces.map((ws) => {
                const wsName = ws.workspace?.name ?? `Workspace ${ws.workspace_id}`
                const isActive = ws.workspace_id === workspaceId
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
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
