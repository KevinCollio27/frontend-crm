"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table"
import {
  CheckIcon,
  ChevronDown,
  CrownIcon,
  LayoutIcon,
  LogOutIcon,
  MailIcon,
  MessageCircleIcon,
  MoreHorizontal,
  PlusCircleIcon,
  PowerIcon,
  SearchIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { teamService } from "@/services/team.service"
import { InviteUserSheet } from "./InviteUserSheet"
import { WorkspaceInviteLinkDialog } from "./WorkspaceInviteLinkDialog"
import type { TeamMemberRaw } from "@/types/team"
import { getInitials, getSortIcon } from "@/lib/table-utils"
import { orgConfirm, confirmDialog } from "@/lib/confirm"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import { useIsWorkspaceOwner } from "@/hooks/useIsWorkspaceOwner"
import { useIsMobile } from "@/hooks/use-mobile"
import { notify } from "@/lib/notify"
import { useSessionStore } from "@/store/session.store"
import { cn } from "@/lib/utils"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
  }
}

export interface TeamMember {
  id: number
  userId: number
  name: string
  email: string
  avatarUrl: string | null
  active: boolean
  admin: boolean
  owner: boolean
  whatsapp: string | null
  whatsappEnabled: boolean
  joinedAt: string
}

function mapMember(r: TeamMemberRaw): TeamMember {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.user?.name ?? "—",
    email: r.user?.email ?? "—",
    avatarUrl: r.user?.avatar_url ?? null,
    active: r.is_active,
    admin: r.is_admin,
    owner: r.is_owner,
    whatsapp: r.whatsapp_number,
    whatsappEnabled: r.whatsapp_enabled,
    joinedAt: r.created_at ? new Date(r.created_at).toLocaleString("es-CL", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    }) : "—",
  }
}

const columnLabels: Record<string, string> = {
  name: "Usuario",
  active: "Activo",
  admin: "Admin",
  owner: "Propietario",
  whatsapp: "WhatsApp",
  joinedAt: "Unido el",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  owner: false,
  whatsapp: false,
}

const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  active:   false,
  admin:    false,
  owner:    false,
  whatsapp: false,
  joinedAt: false,
}

function BoolCell({ value }: { value: boolean }) {
  return value
    ? <CheckIcon className="size-4 text-green-600" />
    : <XIcon className="size-4 text-destructive" />
}

interface ColumnActions {
  onRemove: (member: TeamMember) => void
  onToggleActive: (member: TeamMember) => void
  onToggleAdmin: (member: TeamMember) => void
  onToggleWhatsApp: (member: TeamMember) => void
  onTransferOwnership: (member: TeamMember) => void
  onLeave: (member: TeamMember) => void
}

function getColumns(
  actions: ColumnActions,
  isAdmin: boolean,
  isOwner: boolean,
  currentUserId: number | undefined,
): ColumnDef<TeamMember>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Usuario {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => {
      const name: string = row.getValue("name")
      const email: string = row.original.email
      return (
        <div className="flex items-center gap-2.5">
          <Avatar size="default">
            <AvatarImage src={row.original.avatarUrl ?? "https://github.com/shadcn.png"} alt={name} />
            <AvatarFallback className="text-base">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "active",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Activo {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <BoolCell value={row.getValue("active")} />,
  },
  {
    accessorKey: "admin",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Admin {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <BoolCell value={row.getValue("admin")} />,
  },
  {
    accessorKey: "owner",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Propietario {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => <BoolCell value={row.getValue("owner")} />,
  },
  {
    accessorKey: "whatsapp",
    header: "WhatsApp",
    cell: ({ row }) => {
      const v: string | null = row.getValue("whatsapp")
      return <div className="text-sm text-muted-foreground">{v ?? "—"}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: "joinedAt",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
        Unido el {getSortIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("joinedAt")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const member = row.original
      const isSelf = member.userId === currentUserId
      const canModify = isAdmin && !member.owner && !isSelf
      const canToggleAdmin = isAdmin && !member.owner
      const canTransfer = isOwner && !member.owner && !isSelf
      const canLeave = isSelf && !member.owner
      // Autoactivación permitida: si ya sos admin/owner, prenderte el acceso por WhatsApp
      // no es una escalada de privilegios — ya tenés todo ese acceso desde la web.
      const canToggleWhatsApp = !!member.whatsapp && (canModify || (isSelf && (isAdmin || isOwner)))
      const hasManagementActions = canModify || canToggleAdmin || canTransfer || canToggleWhatsApp

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              {canModify && (
                <DropdownMenuItem onClick={() => actions.onToggleActive(member)}>
                  <PowerIcon />
                  {member.active ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
              )}
              {canToggleAdmin && (
                <DropdownMenuItem onClick={() => actions.onToggleAdmin(member)}>
                  <ShieldIcon />
                  {member.admin ? "Quitar Admin" : "Convertir en Admin"}
                </DropdownMenuItem>
              )}
              {canTransfer && (
                <DropdownMenuItem onClick={() => actions.onTransferOwnership(member)}>
                  <CrownIcon />
                  Transferir Propiedad
                </DropdownMenuItem>
              )}
              {canToggleWhatsApp && (
                <DropdownMenuItem onClick={() => actions.onToggleWhatsApp(member)}>
                  <MessageCircleIcon />
                  {member.whatsappEnabled ? "Desactivar acceso admin por WhatsApp" : "Activar acceso admin por WhatsApp"}
                </DropdownMenuItem>
              )}
              {!hasManagementActions && (
                <DropdownMenuItem disabled>Sin acciones disponibles</DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Acceso rápido</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(member.email)}>
                <MailIcon />
                Copiar email
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {canModify && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => actions.onRemove(member)}>
                  <Trash2Icon />
                  Eliminar usuario
                </DropdownMenuItem>
              </>
            )}
            {canLeave && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => actions.onLeave(member)}>
                  <LogOutIcon />
                  Abandonar workspace
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  ]
}

const skeletonCell: Record<string, React.ReactNode> = {
  select:   <div className="size-4 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  active:   <div className="size-4 animate-pulse rounded bg-muted" />,
  admin:    <div className="size-4 animate-pulse rounded bg-muted" />,
  owner:    <div className="size-4 animate-pulse rounded bg-muted" />,
  whatsapp: <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  joinedAt: <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  actions:  <div className="size-8 animate-pulse rounded bg-muted" />,
}

type BoolFilter = true | false | null

function SimpleFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: BoolFilter
  onChange: (v: BoolFilter) => void
}) {
  const activeLabel =
    value === true ? label : value === false ? `No ${label}` : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
      >
        <PlusCircleIcon className="size-4" />
        {label}
        {activeLabel !== null && (
          <>
            <Separator orientation="vertical" className="mx-1 data-vertical:h-4 data-vertical:self-auto" />
            <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              {activeLabel}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-36">
        <DropdownMenuCheckboxItem
          checked={value === true}
          onCheckedChange={() => onChange(value === true ? null : true)}
        >
          {label}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={value === false}
          onCheckedChange={() => onChange(value === false ? null : false)}
        >
          No {label}
        </DropdownMenuCheckboxItem>
        {value !== null && (
          <>
            <DropdownMenuSeparator />
            <button
              className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onChange(null)}
            >
              Limpiar
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface QueryState {
  page: number
  pageSize: number
  search: string
  isActive: BoolFilter
  isAdmin: BoolFilter
}

export function UsersTable() {
  const router = useRouter()
  const isWorkspaceAdmin = useIsWorkspaceAdmin()
  const isWorkspaceOwner = useIsWorkspaceOwner()
  const currentUserId = useSessionStore((s) => s.user?.id)
  const [members, setMembers] = React.useState<TeamMember[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
    isActive: null,
    isAdmin: null,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [rowSelection, setRowSelection] = React.useState({})
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [shareOpen, setShareOpen] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [visualizacionOpen, setVisualizacionOpen] = React.useState(false)

  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])

  React.useEffect(() => {
    const t = setTimeout(
      () => setQuery((q) => ({ ...q, page: 1, search: searchInput })),
      400
    )
    return () => clearTimeout(t)
  }, [searchInput])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    teamService
      .list({
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
        ...(query.isActive !== null && { is_active: query.isActive }),
        ...(query.isAdmin !== null && { is_admin: query.isAdmin }),
      })
      .then((res) => {
        if (cancelled) return
        setMembers(res.data.map(mapMember))
        setTotal(res.total)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [query, refreshKey])

  const handleRemove = React.useCallback(async (member: TeamMember) => {
    const confirmed = await orgConfirm.delete(member.name)
    if (!confirmed) return
    setMembers((prev) => prev.filter((m) => m.id !== member.id))
    setTotal((t) => t - 1)
    teamService.removeUser(member.id)
      .then(() => {
        notify.success({ title: "Usuario eliminado", description: `"${member.name}" fue eliminado del workspace.` })
      })
      .catch(() => {
        setRefreshKey((k) => k + 1)
        notify.error({ title: "Algo salió mal", description: "No se pudo eliminar al usuario." })
      })
  }, [])

  const handleToggleActive = React.useCallback(async (member: TeamMember) => {
    const nextActive = !member.active
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, active: nextActive } : m)))
    try {
      await teamService.activateUser(member.id, nextActive)
      notify.success({
        title: nextActive ? "Usuario activado" : "Usuario desactivado",
        description: `"${member.name}" ${nextActive ? "puede volver a acceder" : "ya no puede acceder"} al workspace.`,
      })
    } catch (error) {
      setRefreshKey((k) => k + 1)
      const message = (error as { message?: string })?.message
      notify.error({ title: "Algo salió mal", description: message || "No se pudo actualizar el usuario." })
    }
  }, [])

  const handleToggleAdmin = React.useCallback(async (member: TeamMember) => {
    const nextAdmin = !member.admin
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, admin: nextAdmin } : m)))
    try {
      await teamService.setAdmin(member.id, nextAdmin)
      notify.success({
        title: nextAdmin ? "Ahora es Admin" : "Ya no es Admin",
        description: `"${member.name}" ${nextAdmin ? "ahora tiene" : "ya no tiene"} permisos de administrador.`,
      })
    } catch (error) {
      setRefreshKey((k) => k + 1)
      const message = (error as { message?: string })?.message
      notify.error({ title: "Algo salió mal", description: message || "No se pudo actualizar el rol." })
    }
  }, [])

  const handleToggleWhatsApp = React.useCallback(async (member: TeamMember) => {
    const nextEnabled = !member.whatsappEnabled
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, whatsappEnabled: nextEnabled } : m)))
    try {
      await teamService.setWhatsAppEnabled(member.id, nextEnabled)
      notify.success({
        title: nextEnabled ? "Acceso admin activado" : "Acceso admin desactivado",
        description: `"${member.name}" ${nextEnabled ? "ya puede gestionar el CRM" : "ya no puede gestionar el CRM"} por WhatsApp.`,
      })
    } catch (error) {
      setRefreshKey((k) => k + 1)
      const message = (error as { message?: string })?.message
      notify.error({ title: "Algo salió mal", description: message || "No se pudo actualizar el acceso." })
    }
  }, [])

  const handleTransferOwnership = React.useCallback(async (member: TeamMember) => {
    const confirmed = await confirmDialog({
      title: "¿Transferir la propiedad del workspace?",
      description: `"${member.name}" pasará a ser el propietario del workspace y vos dejarás de serlo (seguirás siendo admin). Esta acción no se puede deshacer desde acá.`,
      confirmText: "Sí, transferir",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!confirmed) return
    try {
      await teamService.transferOwnership(member.id)
      setRefreshKey((k) => k + 1)
      notify.success({ title: "Propiedad transferida", description: `"${member.name}" es ahora el propietario del workspace.` })
    } catch (error) {
      const message = (error as { message?: string })?.message
      notify.error({ title: "Algo salió mal", description: message || "No se pudo transferir la propiedad." })
    }
  }, [])

  const handleLeave = React.useCallback(async (member: TeamMember) => {
    const confirmed = await confirmDialog({
      title: "¿Abandonar este workspace?",
      description: "Vas a perder acceso a este workspace de inmediato.",
      confirmText: "Sí, abandonar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!confirmed) return
    try {
      await teamService.leaveWorkspace(member.id)
      notify.success({ title: "Abandonaste el workspace", description: "Ya no tienes acceso a este workspace." })

      const res = await fetch("/api/auth/me")
      const data = await res.json()
      const nextWorkspace = data.user?.user_workspace?.[0]

      if (data.user && nextWorkspace) {
        await fetch("/api/auth/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: nextWorkspace.workspace_id }),
        })
        useSessionStore.getState().setSession(data.user, nextWorkspace.workspace_id)
        router.replace("/chat")
      } else {
        useSessionStore.getState().setSession(data.user, null)
        router.replace("/create-workspace")
      }
    } catch (error) {
      const message = (error as { message?: string })?.message
      notify.error({ title: "Algo salió mal", description: message || "No se pudo abandonar el workspace." })
    }
  }, [router])

  const columns = React.useMemo(
    () => getColumns(
      {
        onRemove: handleRemove,
        onToggleActive: handleToggleActive,
        onToggleAdmin: handleToggleAdmin,
        onToggleWhatsApp: handleToggleWhatsApp,
        onTransferOwnership: handleTransferOwnership,
        onLeave: handleLeave,
      },
      isWorkspaceAdmin,
      isWorkspaceOwner,
      currentUserId,
    ),
    [handleRemove, handleToggleActive, handleToggleAdmin, handleToggleWhatsApp, handleTransferOwnership, handleLeave, isWorkspaceAdmin, isWorkspaceOwner, currentUserId]
  )

  const pagination: PaginationState = { pageIndex: query.page - 1, pageSize: query.pageSize }

  const handlePagination = (
    updater: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => {
    const next = typeof updater === "function" ? updater(pagination) : updater
    setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
  }

  const hasActiveFilters = searchInput || query.isActive !== null || query.isAdmin !== null

  const resetFilters = () => {
    setSearchInput("")
    setQuery((q) => ({ ...q, page: 1, search: "", isActive: null, isAdmin: null }))
  }

  const table = useReactTable({
    data: members,
    columns,
    manualPagination: true,
    rowCount: total,
    onPaginationChange: handlePagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
  })

  return (
    <div className="w-full">
      {/* Toolbar. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 py-4 md:flex-row md:items-center">
        <div className="relative w-full shrink-0 md:w-44">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nombre y correo..."
            className="h-8 pl-8 text-xs"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu open={visualizacionOpen} onOpenChange={setVisualizacionOpen}>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
              <LayoutIcon className="size-4" />
              Visualización
              <ChevronDown className={cn("size-4 transition-transform", visualizacionOpen && "rotate-180")} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {columnLabels[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <SlidersHorizontalIcon className="size-3.5" />
            Filtros
            <ChevronDown className={cn("size-3.5 transition-transform", filtersOpen && "rotate-180")} />
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetFilters}>
              <XIcon className="size-3.5" />
              Restablecer
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          <span className="w-full text-xs text-muted-foreground md:w-auto">
            {total} usuarios
          </span>
          <Button variant="outline" size="sm" className="w-full md:w-auto" onClick={() => setShareOpen(true)}>
            Compartir
          </Button>
          {isWorkspaceAdmin && (
            <Button size="sm" className="w-full md:w-auto" onClick={() => setInviteOpen(true)}>
              <UserPlusIcon className="size-4" />
              Invitar Usuario
            </Button>
          )}
        </div>
      </div>

      {/* Fila de filtros avanzados, colapsada por defecto (botón "Filtros" de arriba) */}
      {filtersOpen && (
        <div className="flex flex-col gap-2 rounded-md bg-muted/30 px-3 py-2 md:flex-row md:items-center">
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SimpleFilter
                label="Activo"
                value={query.isActive}
                onChange={(v) => setQuery((q) => ({ ...q, page: 1, isActive: v }))}
              />
            </div>
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <SimpleFilter
                label="Admin"
                value={query.isAdmin}
                onChange={(v) => setQuery((q) => ({ ...q, page: 1, isAdmin: v }))}
              />
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.columnDef.meta?.className}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: query.pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {table.getVisibleLeafColumns().map((col) => (
                    <TableCell key={col.id}>
                      {skeletonCell[col.id] ?? <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="py-4">
        <DataTablePagination table={table} />
      </div>

      <InviteUserSheet open={inviteOpen} onOpenChange={setInviteOpen} onSuccess={() => setRefreshKey((k) => k + 1)} />
      <WorkspaceInviteLinkDialog open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  )
}
