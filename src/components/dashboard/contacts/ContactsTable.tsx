"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table"
import {
  ArrowDownUpIcon,
  ArrowRightLeftIcon,
  ChevronDown,
  ExternalLinkIcon,
  GitMergeIcon,
  ListIcon,
  Loader2Icon,
  MailIcon,
  MessageSquareTextIcon,
  MoreHorizontal,
  PencilIcon,
  PhoneIcon,
  PlusCircleIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FcGoogle } from "react-icons/fc"
import { useEntityRealtime } from "@/hooks/useEntityRealtime"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
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
import { ContactPreviewSheet } from "./ContactPreviewSheet"
import { CreateContactSheet } from "./CreateContactSheet"
import { ImportGoogleContactsSheet } from "./ImportGoogleContactsSheet"
import { DuplicateContactsSheet } from "./DuplicateContactsSheet"
import { ContactsImportExportSheet } from "./ContactsImportExportSheet"
import { MoveContactsSheet } from "./MoveContactsSheet"
import { SendTemplateSheet } from "./SendTemplateSheet"
import { contactService, type CountryCount } from "@/services/contact.service"
import { organizationService, type OrganizationOption } from "@/services/organization.service"
import { whatsappService } from "@/services/whatsapp.service"
import { contactConfirm } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { useIntegrations } from "@/hooks/useIntegrations"
import { useIsMobile } from "@/hooks/use-mobile"
import { isWhatsAppOperational } from "@/lib/whatsapp-status"
import type { Person } from "@/types/contact"
import type { WhatsappTemplateRaw } from "@/types/whatsapp"
import { getFlag, getSortIcon, getInitials } from "@/lib/table-utils"
import { cn } from "@/lib/utils"

export interface Contact {
  id: number
  name: string
  org: string
  orgId: number | null
  email: string
  phone: string
  country: string
  source: string
  createdAt: string
  internalPosition: string
}

function mapPerson(p: Person): Contact {
  const email = p.person_detail?.find((d) => d.label?.key === "email")?.value ?? ""
  const phone =
    p.person_detail?.find((d) => d.label?.key === "phone" || d.label?.key === "telefono")?.value ?? ""
  return {
    id: p.id,
    name: p.name,
    org: p.organization?.name ?? "Sin organización",
    orgId: p.organization_id ?? null,
    email,
    phone,
    country: p.pais_origen ?? "CL",
    source: p.contact_source ?? p.origin ?? "CRM",
    createdAt: (p.created_at ?? "").slice(0, 10),
    internalPosition: p.internal_position ?? "",
  }
}

const COUNTRY_LABELS: Record<string, string> = {
  CL: "Chile",
  AR: "Argentina",
  CO: "Colombia",
  MX: "México",
  PE: "Perú",
  BR: "Brasil",
  UY: "Uruguay",
  EC: "Ecuador",
  VE: "Venezuela",
  BO: "Bolivia",
  PY: "Paraguay",
}

const columnLabels: Record<string, string> = {
  id: "ID",
  name: "Nombre",
  org: "Organización",
  phone: "Teléfono",
  country: "País",
  source: "Fuente",
  createdAt: "Creado",
  internalPosition: "Cargo",
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  source: false,
  createdAt: false,
  internalPosition: false,
}

// En mobile no hay espacio para columnas de más — solo Nombre queda visible por
// defecto (Acciones y el checkbox de selección no dependen de esto, siempre se ven).
const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id: false,
  org: false,
  internalPosition: false,
  phone: false,
  country: false,
  source: false,
  createdAt: false,
}

function getColumns(
  onPreview: (contact: Contact) => void,
  onDetail: (contact: Contact) => void,
  onEdit: (contact: Contact) => void,
  onDelete: (contact: Contact) => void,
  onMove: (contact: Contact) => void,
  onSendTemplate: ((contact: Contact) => void) | null
): ColumnDef<Contact>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          ID {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground text-xs">#{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Nombre {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const name: string = row.getValue("name")
        const email: string = row.original.email
        return (
          <div className="flex items-center gap-2.5">
            <Avatar size="default">
              <AvatarImage src="https://github.com/shadcn.png" alt={name} />
              <AvatarFallback className="text-base">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">{email || "—"}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "org",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Organización {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-stretch gap-2.5">
            {c.orgId !== null && <EntityAccentBar seed={c.orgId} />}
            <span className="text-sm self-center">{c.org}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "internalPosition",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Cargo {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {(row.getValue("internalPosition") as string) || "—"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      enableSorting: false,
      header: "Teléfono",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {(row.getValue("phone") as string) || "—"}
        </div>
      ),
    },
    {
      accessorKey: "country",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          País {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => {
        const code: string = row.getValue("country")
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <span>{getFlag(code)}</span>
            <span>{code}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Fuente {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize text-sm">{row.getValue("source")}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" className="-ml-3" onClick={() => column.toggleSorting()}>
          Creado {getSortIcon(column.getIsSorted())}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.getValue("createdAt")}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const contact = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="h-8 w-8 p-0" variant="ghost" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onDetail(contact)}>
                  <ExternalLinkIcon />
                  Ver Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPreview(contact)}>
                  <UserIcon />
                  Vista Previa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(contact)}>
                  <PencilIcon />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(contact)}>
                  <ArrowRightLeftIcon />
                  Mover de espacio
                </DropdownMenuItem>
                {onSendTemplate && (
                  <DropdownMenuItem
                    disabled={!contact.phone}
                    title={!contact.phone ? "Este contacto no tiene teléfono" : undefined}
                    onClick={() => onSendTemplate(contact)}
                  >
                    <MessageSquareTextIcon />
                    Enviar Plantilla
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              {(contact.email || contact.phone) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Acceso rápido</DropdownMenuLabel>
                    {contact.email && (
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(contact.email)
                          toast.success("Correo copiado", {
                            description: "Has copiado el correo con éxito.",
                          })
                        }}
                      >
                        <MailIcon />
                        Copiar email
                      </DropdownMenuItem>
                    )}
                    {contact.phone && (
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(contact.phone)
                          toast.success("Teléfono copiado", {
                            description: "Has copiado el teléfono con éxito.",
                          })
                        }}
                      >
                        <PhoneIcon />
                        Copiar teléfono
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(contact)}
              >
                <Trash2Icon />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const skeletonCell: Record<string, React.ReactNode> = {
  select: <div className="size-4 animate-pulse rounded bg-muted" />,
  id:     <div className="h-3 w-8 animate-pulse rounded bg-muted" />,
  name: (
    <div className="flex items-center gap-2.5">
      <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
  org:              <div className="h-4 w-32 animate-pulse rounded bg-muted" />,
  internalPosition: <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  phone:            <div className="h-4 w-24 animate-pulse rounded bg-muted" />,
  country: (
    <div className="flex items-center gap-1.5">
      <div className="size-4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-6 animate-pulse rounded bg-muted" />
    </div>
  ),
  source:    <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  createdAt: <div className="h-4 w-20 animate-pulse rounded bg-muted" />,
  actions:   <div className="size-8 animate-pulse rounded bg-muted" />,
}

// Busca con debounce contra el backend (organizationService.list, paginado) en vez
// de cargar todas las organizaciones del workspace de una — con workspaces grandes
// (CamionGO y sus cientos de organizaciones) el listado completo tardaba ~10s en
// cargar y renderizar. El nombre de la seleccionada se guarda aparte porque puede
// no estar en la página de resultados actual una vez que cambias la búsqueda.
function OrgFilter({
  selected,
  onChange,
}: {
  selected: number | null
  onChange: (id: number | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [items, setItems] = React.useState<OrganizationOption[]>([])
  const [searching, setSearching] = React.useState(false)
  const [selectedName, setSelectedName] = React.useState<string | null>(null)
  const [dropStyle, setDropStyle] = React.useState<React.CSSProperties>({})
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await organizationService.list({ filter: search || undefined, take: 20 })
        if (!cancelled) setItems(res.data.map((o) => ({ id: o.id, name: o.name })))
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [search, open])

  function handleOpen() {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setDropStyle({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 220) })
    }
    setOpen((o) => !o)
  }

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function pick(org: OrganizationOption) {
    const isSame = selected === org.id
    onChange(isSame ? null : org.id)
    setSelectedName(isSame ? null : org.name)
    setOpen(false)
    setSearch("")
  }

  function clear() {
    onChange(null)
    setSelectedName(null)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        className="h-8 border-dashed"
        onClick={handleOpen}
      >
        <PlusCircleIcon className="size-3.5" />
        Organización
        {selected !== null && (
          <>
            <Separator
              orientation="vertical"
              className="mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-auto"
            />
            <span className="flex max-w-35 items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              {selected !== null && <EntityAccentBar seed={selected} className="h-3.5" />}
              <span className="truncate">{selectedName ?? "…"}</span>
            </span>
          </>
        )}
      </Button>

      {open && (
        <div
          className="fixed z-50 rounded-lg border bg-popover text-popover-foreground shadow-md"
          style={dropStyle}
        >
          <div className="border-b p-1.5">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar organización..."
              className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-60 min-w-44 overflow-y-auto p-1">
            {searching ? (
              <div className="flex justify-center py-4">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Sin resultados</p>
            ) : (
              items.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => pick(org)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    selected === org.id && "bg-accent/50 font-medium"
                  )}
                >
                  <EntityAccentBar seed={org.id} className="h-4" />
                  <span className="truncate">{org.name}</span>
                </button>
              ))
            )}
          </div>
          {selected !== null && (
            <>
              <DropdownMenuSeparator />
              <button
                className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={clear}
              >
                Limpiar filtro
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface QueryState {
  page: number
  pageSize: number
  search: string
  orgId: number | null
  countries: string[]
  sortBy: string | undefined
  sortOrder: "asc" | "desc" | undefined
}

export function ContactsTable() {
  const router = useRouter()
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [query, setQuery] = React.useState<QueryState>({
    page: 1,
    pageSize: 10,
    search: "",
    orgId: null,
    countries: [],
    sortBy: undefined,
    sortOrder: undefined,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const isMobile = useIsMobile()
  React.useEffect(() => {
    if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
  }, [isMobile])
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editContactId, setEditContactId] = React.useState<number | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [importOpen, setImportOpen] = React.useState(false)
  const [mergeOpen, setMergeOpen] = React.useState(false)
  const [importExportOpen, setImportExportOpen] = React.useState(false)
  const [moveOpen, setMoveOpen] = React.useState(false)
  const [moveInitialIds, setMoveInitialIds] = React.useState<number[]>([])
  const [sendTemplateContact, setSendTemplateContact] = React.useState<Contact | null>(null)
  const [approvedTemplates, setApprovedTemplates] = React.useState<WhatsappTemplateRaw[]>([])
  const { connections: integrationConnections } = useIntegrations()
  const googleContactsIntegration = integrationConnections.find((c) => c.provider_key === "google-contacts")
  const [countryCounts, setCountryCounts] = React.useState<CountryCount[]>([])

  // "Enviar Plantilla" solo aparece si WhatsApp está operativo Y hay al menos una
  // plantilla aprobada — se chequea una vez al cargar, no por cada fila.
  React.useEffect(() => {
    Promise.all([
      whatsappService.getMetaConfig().catch(() => null),
      whatsappService.getCachedTemplates({ status: "APPROVED" }).catch(() => ({ templates: [], total: 0, lastSyncedAt: null })),
    ]).then(([config, templatesRes]) => {
      setApprovedTemplates(isWhatsAppOperational(config) ? templatesRes.templates : [])
    })
  }, [])
  const canSendTemplate = approvedTemplates.length > 0

  // Tiempo real: si otra sesión crea/edita/elimina un contacto en este
  // workspace, refresca la tabla sin esperar a un F5 manual. El evento real
  // que emite el backend es "contact" (person.controller.ts), no "person".
  useEntityRealtime("contact", () => setRefreshKey((k) => k + 1))

  React.useEffect(() => {
    const t = setTimeout(
      () => setQuery((q) => {
        if (q.search === searchInput) return q
        return { ...q, page: 1, search: searchInput }
      }),
      400
    )
    return () => clearTimeout(t)
  }, [searchInput])

  React.useEffect(() => {
    const selected = (columnFilters.find((f) => f.id === "country")?.value as string[]) ?? []
    setQuery((q) => {
      if (JSON.stringify(q.countries) === JSON.stringify(selected)) return q
      return { ...q, page: 1, countries: selected }
    })
  }, [columnFilters])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const t0 = performance.now()
    contactService
      .list({
        page: query.page,
        take: query.pageSize,
        filter: query.search || undefined,
        organization_id: query.orgId ?? undefined,
        country: query.countries.length > 0 ? query.countries : undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      })
      .then((res) => {
        if (cancelled) return
        setContacts(res.data.map(mapPerson))
        setTotal(res.total)
        setLoading(false)
        console.log(`[ContactsTable] fetch+render page=${query.page} total=${res.total} → ${(performance.now() - t0).toFixed(1)}ms`)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query, refreshKey])

  React.useEffect(() => {
    contactService.countryCounts().then(setCountryCounts).catch(() => {})
  }, [])

  const countryOptions = React.useMemo(
    () =>
      countryCounts.map((c) => ({
        label: COUNTRY_LABELS[c.code] ?? c.code,
        value: c.code,
        icon: (
          <img
            src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
            alt={c.code}
            width={20}
            height={15}
          />
        ),
      })),
    [countryCounts]
  )

  const countryCountsMap = React.useMemo(
    () => new Map(countryCounts.map((c) => [c.code, c.count])),
    [countryCounts]
  )

  const pagination: PaginationState = { pageIndex: query.page - 1, pageSize: query.pageSize }

  const handlePagination = (
    updater: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => {
    const next = typeof updater === "function" ? updater(pagination) : updater
    setQuery((q) => ({ ...q, page: next.pageIndex + 1, pageSize: next.pageSize }))
  }

  const handleOrgFilter = (id: number | null) => {
    setQuery((q) => ({ ...q, page: 1, orgId: id }))
  }

  const hasActiveFilters = searchInput || query.orgId !== null || columnFilters.length > 0

  const resetFilters = () => {
    setSearchInput("")
    setQuery((q) => ({ ...q, page: 1, search: "", orgId: null }))
    setColumnFilters([])
  }

  async function handleDeleteClick(contact: Contact) {
    const { canDelete, opportunityCount } = await contactService.checkCanDelete(contact.id)
    if (!canDelete) {
      await contactConfirm.blockedByOpportunity(contact.name, opportunityCount)
      return
    }
    const confirmed = await contactConfirm.delete(contact.name)
    if (!confirmed) return
    try {
      await contactService.delete(contact.id)
      notify.success({ title: "Contacto eliminado", description: `"${contact.name}" fue eliminado correctamente.` })
      setRefreshKey((k) => k + 1)
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo eliminar el contacto." })
    }
  }

  const columns = React.useMemo(
    () =>
      getColumns(
        (contact) => {
          setSelectedContact(contact)
          setSheetOpen(true)
        },
        (contact) => router.push(`/crm/contacts/${contact.id}`),
        (contact) => {
          setEditContactId(contact.id)
          setEditOpen(true)
        },
        handleDeleteClick,
        (contact) => {
          setMoveInitialIds([contact.id])
          setMoveOpen(true)
        },
        canSendTemplate ? (contact) => setSendTemplateContact(contact) : null,
      ),
    [router, canSendTemplate]
  )

  const handleSorting = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === "function" ? updater(sorting) : updater
    setSorting(next)
    const col = next[0]
    setQuery((q) => ({
      ...q,
      page: 1,
      sortBy: col?.id,
      sortOrder: col ? (col.desc ? "desc" : "asc") : undefined,
    }))
  }

  const table = useReactTable({
    data: contacts,
    columns,
    manualPagination: true,
    manualSorting: true,
    rowCount: total,
    onPaginationChange: handlePagination,
    onSortingChange: handleSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
  })

  const selectedRowIds = table.getSelectedRowModel().rows.map((r) => r.original.id)

  function handleOpenMove() {
    setMoveInitialIds(selectedRowIds)
    setMoveOpen(true)
  }

  return (
    <div className="w-full">
      {/* Row 1 — view toggle + create */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
          <span className="flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs font-medium shadow-sm">
            <ListIcon className="size-3.5" />
            Lista
          </span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Crear Contacto</Button>
      </div>

      {/* Row 2 — filters. En mobile se apila en filas propias en vez de forzar scroll
          horizontal; desde md hacia arriba queda igual que antes. */}
      <div className="flex flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full shrink-0 md:w-44">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar contacto..."
              className="h-8 pl-8 text-xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <OrgFilter selected={query.orgId} onChange={handleOrgFilter} />
            </div>

            <Separator orientation="vertical" className="mx-0.5 hidden data-[orientation=vertical]:h-5 data-[orientation=vertical]:self-auto md:block" />

            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <DataTableFacetedFilter
                column={table.getColumn("country")!}
                title="País"
                options={countryOptions}
                counts={countryCountsMap}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="col-span-2 h-8 px-2 text-xs md:col-span-1 md:w-auto" onClick={resetFilters}>
                <XIcon className="size-3.5" />
                Restablecer
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:ml-auto">
          <span className="text-xs text-muted-foreground">{total} contactos</span>

          <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-2">
            {/* Columnas siempre visible — es la acción más usada de las 4 */}
            <div className="[&_button]:w-full md:[&_button]:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
                  Columnas <ChevronDown className="ml-1.5 size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        className="capitalize"
                        checked={col.getIsVisible()}
                        onCheckedChange={(value) => col.toggleVisibility(!!value)}
                      >
                        {columnLabels[col.id] ?? col.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop: el resto de acciones sueltas, igual que antes */}
            <div className="hidden items-center gap-2 md:flex">
              {googleContactsIntegration && (
                <Button variant="outline" size="sm" className="h-8" onClick={() => setImportOpen(true)}>
                  <FcGoogle className="size-3.5" />
                  Importar con Google
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8" onClick={() => setMergeOpen(true)}>
                <GitMergeIcon className="size-3.5" />
                Fusionar duplicados
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={handleOpenMove}>
                <ArrowRightLeftIcon className="size-3.5" />
                Mover de espacio{selectedRowIds.length > 0 ? ` (${selectedRowIds.length})` : ""}
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setImportExportOpen(true)}>
                <ArrowDownUpIcon className="size-3.5" />
                Importar / Exportar
              </Button>
            </div>

            {/* Mobile: el resto de acciones agrupadas en un menú, para no apilar botones */}
            <div className="[&_button]:w-full md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
                  <MoreHorizontal className="size-3.5" />
                  Más
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    {googleContactsIntegration && (
                      <DropdownMenuItem onClick={() => setImportOpen(true)}>
                        <FcGoogle className="size-3.5" />
                        Importar con Google
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setMergeOpen(true)}>
                      <GitMergeIcon className="size-3.5" />
                      Fusionar duplicados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenMove}>
                      <ArrowRightLeftIcon className="size-3.5" />
                      Mover de espacio{selectedRowIds.length > 0 ? ` (${selectedRowIds.length})` : ""}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setImportExportOpen(true)}>
                      <ArrowDownUpIcon className="size-3.5" />
                      Importar / Exportar
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
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

      <div className="px-4 py-3">
        <DataTablePagination table={table} />
      </div>

      <ContactPreviewSheet
        contact={selectedContact}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onViewDetails={selectedContact ? () => router.push(`/crm/contacts/${selectedContact.id}`) : undefined}
      />

      <CreateContactSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {editOpen && (
        <CreateContactSheet
          open
          onOpenChange={(v) => { if (!v) setEditOpen(false) }}
          contactId={editContactId ?? undefined}
          onSuccess={() => { setEditOpen(false); setRefreshKey((k) => k + 1) }}
        />
      )}

      {googleContactsIntegration && (
        <ImportGoogleContactsSheet
          open={importOpen}
          onOpenChange={setImportOpen}
          integrationId={googleContactsIntegration.id}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {mergeOpen && (
        <DuplicateContactsSheet
          open
          onOpenChange={(o) => { if (!o) setMergeOpen(false) }}
          onMerged={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {importExportOpen && (
        <ContactsImportExportSheet
          open
          onOpenChange={(o) => { if (!o) setImportExportOpen(false) }}
          totalContacts={total}
          onImported={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {moveOpen && (
        <MoveContactsSheet
          open
          onOpenChange={(o) => { if (!o) setMoveOpen(false) }}
          initialSelectedIds={moveInitialIds}
          onMoved={() => { setRowSelection({}); setRefreshKey((k) => k + 1) }}
        />
      )}

      {sendTemplateContact && (
        <SendTemplateSheet
          open
          onOpenChange={(o) => { if (!o) setSendTemplateContact(null) }}
          contactName={sendTemplateContact.name}
          phone={sendTemplateContact.phone}
          country={sendTemplateContact.country}
          templates={approvedTemplates}
        />
      )}
    </div>
  )
}
