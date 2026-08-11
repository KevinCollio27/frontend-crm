"use client"

import * as React from "react"
import { ChevronDownIcon, LoaderCircleIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { EntityAccentBar } from "@/components/ui/entity-accent-bar"
import { organizationService, type OrganizationOption } from "@/services/organization.service"

// Busca con debounce contra el backend (organizationService.list, paginado) en vez
// de cargar todas las organizaciones del workspace de una — con workspaces grandes
// (ej. CamionGO y sus cientos de organizaciones) cargar/renderizar todo de una tardaba
// ~10s. Mismo look que SearchableSelect, pero con datos servidos on-demand.
export function OrgAsyncSelect({
  value,
  selectedName,
  onChange,
  disabled,
  placeholder = "Selecciona una organización",
}: {
  value: number | null
  selectedName: string | null
  onChange: (org: OrganizationOption | null) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [items, setItems] = React.useState<OrganizationOption[]>([])
  const [searching, setSearching] = React.useState(false)
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})
  const containerRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

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
    if (disabled) return
    if (!open) {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setDropdownStyle({ top: rect.bottom + 6, left: rect.left, width: rect.width })
      }
      // Precarga el buscador con lo ya seleccionado — así si te equivocaste lo ves de
      // inmediato al reabrir, junto con otros resultados parecidos.
      setSearch(selectedName ?? "")
    }
    setOpen((o) => !o)
  }

  function handleClear() {
    setSearch("")
    onChange(null)
  }

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-ring ring-3 ring-ring/50"
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-2", value ? "text-foreground" : "text-muted-foreground")}>
          {value ? (
            <>
              <EntityAccentBar seed={value} className="h-4" />
              <span className="truncate">{selectedName ?? "…"}</span>
            </>
          ) : (
            disabled ? "Cargando..." : placeholder
          )}
        </span>
        <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="fixed z-50 rounded-lg border bg-popover text-popover-foreground shadow-md" style={dropdownStyle}>
          <div className="flex items-center gap-1 border-b p-1.5">
            <input
              autoFocus
              placeholder="Buscar organización..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-0 flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={handleClear}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Limpiar"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-x-hidden overflow-y-auto p-1">
            {searching ? (
              <div className="flex justify-center py-4">
                <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Sin resultados</p>
            ) : (
              items.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => { onChange(org); setOpen(false); setSearch("") }}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    value === org.id && "bg-accent/50 font-medium"
                  )}
                >
                  <EntityAccentBar seed={org.id} className="h-4" />
                  <span className="truncate">{org.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
