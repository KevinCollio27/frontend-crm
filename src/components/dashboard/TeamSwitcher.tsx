"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDownIcon, PlusIcon, SearchIcon, ShieldIcon } from "lucide-react"
import { useSessionStore } from "@/store/session.store"
import { saveLastWorkspace } from "@/lib/workspace-pref"
import { flowService } from "@/services/flow.service"
import { workspaceService, type PlatformAdminWorkspaceOverview } from "@/services/workspace.service"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { UserWorkspace } from "@/types/auth"
import { WorkspaceLogo } from "@/components/shared/WorkspaceLogo"
import { cn } from "@/lib/utils"

// Panel flotante propio (no DropdownMenu) — mismo patrón que SearchableSelect/OrgFilter,
// porque mezclar un input de búsqueda + Tabs dentro de un DropdownMenu choca con su
// navegación por teclado pensada para ítems de menú, no para escribir texto.
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

  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [tab, setTab] = React.useState<"mine" | "admin">("mine")
  const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({})
  const containerRef = React.useRef<HTMLDivElement>(null)

  const workspaces: UserWorkspace[] = user?.user_workspace ?? []
  const ownWorkspaceIds = new Set(workspaces.map((w) => w.workspace_id))
  const active = workspaces.find((w) => w.workspace_id === workspaceId) ?? workspaces[0]

  function closePanel() {
    setOpen(false)
    setSearch("")
    setTab("mine")
  }

  // Solo se pide una vez que se abre el menú, y solo si es admin de plataforma —
  // un usuario normal nunca dispara este request.
  function handleOpen() {
    if (!open && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect()
      setPanelStyle(
        isMobile
          ? { top: r.bottom + 6, left: r.left, width: Math.max(r.width, 260) }
          : { top: r.top, left: r.right + 8, width: 260 }
      )
      if (isPlatformAdmin && allWorkspaces === null) {
        workspaceService.getPlatformAdminOverview().then(setAllWorkspaces).catch(() => setAllWorkspaces([]))
      }
    }
    setOpen((o) => !o)
  }

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closePanel()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

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
    closePanel()
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
    if (ws.id === workspaceId) { closePanel(); return }
    setEnteringId(ws.id)
    await fetch("/api/auth/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: ws.id }),
    })
    flowService.invalidateCache()
    useSessionStore.getState().enterAsPlatformAdmin({ id: ws.id, name: ws.name })
    setEnteringId(null)
    closePanel()
  }

  const activeName = platformAdminViewing?.name ?? active?.workspace?.name ?? "Workspace"
  const activeLogo = platformAdminViewing ? undefined : active?.workspace?.logo
  const foreignWorkspaces = (allWorkspaces ?? []).filter((w) => !ownWorkspaceIds.has(w.id))

  const q = search.trim().toLowerCase()
  const filteredMine = q
    ? workspaces.filter((ws) => (ws.workspace?.name ?? "").toLowerCase().includes(q))
    : workspaces
  const filteredForeign = q
    ? foreignWorkspaces.filter((ws) => ws.name.toLowerCase().includes(q))
    : foreignWorkspaces

  const searchBox = (
    <div className="border-b p-1.5">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar workspace..."
          className="w-full bg-transparent py-1.5 pl-7 pr-2 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div ref={containerRef} className="relative">
          <SidebarMenuButton
            size="lg"
            onClick={handleOpen}
            className={cn(open && "bg-sidebar-accent text-sidebar-accent-foreground")}
          >
            <WorkspaceLogo name={activeName} logo={activeLogo} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {platformAdminViewing ? "Admin — ajeno" : "Workspace"}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </SidebarMenuButton>

          {open && (
            <div
              className="fixed z-50 flex max-h-100 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md"
              style={panelStyle}
            >
              {isPlatformAdmin ? (
                <Tabs value={tab} onValueChange={(v) => { setTab(v as "mine" | "admin"); setSearch("") }} className="min-h-0 flex-1 gap-0">
                  <TabsList className="m-1.5 mb-0">
                    <TabsTrigger value="mine">Mis workspaces</TabsTrigger>
                    <TabsTrigger value="admin" className="gap-1.5">
                      <ShieldIcon className="size-3" />
                      Modo Admin
                    </TabsTrigger>
                  </TabsList>

                  {searchBox}

                  <TabsContent value="mine" className="m-0 min-h-0 overflow-y-auto p-1">
                    <WorkspaceList items={filteredMine} activeId={!platformAdminViewing ? workspaceId : null} onSelect={handleSwitch} />
                  </TabsContent>

                  <TabsContent value="admin" className="m-0 min-h-0 overflow-y-auto p-1">
                    {allWorkspaces === null ? (
                      <div className="px-2 py-3 text-center text-xs text-muted-foreground">Cargando...</div>
                    ) : filteredForeign.length === 0 ? (
                      <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                        {q ? "Sin resultados." : "No hay otros workspaces."}
                      </div>
                    ) : (
                      filteredForeign.map((ws) => {
                        const isActive = ws.id === workspaceId && !!platformAdminViewing
                        return (
                          <button
                            key={ws.id}
                            type="button"
                            onClick={() => handleEnterForeign(ws)}
                            disabled={enteringId !== null}
                            className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                          >
                            <WorkspaceLogo name={ws.name} size="md" />
                            <span className={isActive ? "font-medium" : ""}>{ws.name}</span>
                            {enteringId === ws.id && (
                              <span className="ml-auto text-xs text-muted-foreground">Entrando...</span>
                            )}
                            {isActive && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-foreground" />}
                          </button>
                        )
                      })
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  {searchBox}
                  <div className="min-h-0 overflow-y-auto p-1">
                    <WorkspaceList items={filteredMine} activeId={workspaceId} onSelect={handleSwitch} />
                  </div>
                </div>
              )}

              <div className="border-t p-1">
                <button
                  type="button"
                  onClick={() => { closePanel(); router.push("/create-workspace") }}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-muted">
                    <PlusIcon className="size-3.5" />
                  </div>
                  <span className="text-muted-foreground">Crear workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function WorkspaceList({
  items,
  activeId,
  onSelect,
}: {
  items: UserWorkspace[]
  activeId: number | null | undefined
  onSelect: (ws: UserWorkspace) => void
}) {
  if (items.length === 0) {
    return <div className="px-2 py-3 text-center text-xs text-muted-foreground">Sin resultados.</div>
  }
  return (
    <>
      {items.map((ws) => {
        const wsName = ws.workspace?.name ?? `Workspace ${ws.workspace_id}`
        const isActive = ws.workspace_id === activeId
        return (
          <button
            key={ws.workspace_id}
            type="button"
            onClick={() => onSelect(ws)}
            className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <WorkspaceLogo name={wsName} logo={ws.workspace?.logo} size="md" />
            <span className={isActive ? "font-medium" : ""}>{wsName}</span>
            {isActive && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-foreground" />}
          </button>
        )
      })}
    </>
  )
}
