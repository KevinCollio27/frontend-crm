"use client"

import * as React from "react"
import { CheckCheckIcon, ChevronDownIcon, ListIcon, Loader2Icon, PlusCircleIcon, PlusIcon, SearchIcon, Trash2Icon, UsersIcon } from "lucide-react"
import { notify } from "@/lib/notify"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { OrgAsyncSelect } from "@/components/shared/OrgAsyncSelect"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getInitials } from "@/lib/table-utils"
import { cn } from "@/lib/utils"
import { Section } from "@/components/ui/section"
import { contactService, type CountryCount } from "@/services/contact.service"
import type { Person } from "@/types/contact"
import type { AudienceMode, CampaignFormState, CrmFilter, CustomRecipient } from "../shared/form-state"

const PAGE_SIZE = 10
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim())
}

function getEmail(contact: Person): string {
  const detail = contact.person_detail.find(
    (d) => d.label?.type === "email" || d.label?.key === "email"
  )
  return detail?.value ?? ""
}

function emptyRecipient(): CustomRecipient {
  return { id: crypto.randomUUID(), name: "", email: "" }
}

interface Step2AudienceProps {
  form: CampaignFormState
  setForm: React.Dispatch<React.SetStateAction<CampaignFormState>>
}

export function Step2Audience({ form, setForm }: Step2AudienceProps) {
  const [contacts, setContacts] = React.useState<Person[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [selectingAll, setSelectingAll] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [countryCounts, setCountryCounts] = React.useState<CountryCount[]>([])
  const [blockNumber, setBlockNumber] = React.useState(1)
  const [blockSize, setBlockSize] = React.useState(3000)
  const [selectingBlock, setSelectingBlock] = React.useState(false)

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Conteos por país para el filtro — se piden una sola vez
  React.useEffect(() => {
    contactService.countryCounts().then(setCountryCounts).catch(() => {})
  }, [])

  function buildListParams(pageNum: number, take: number): Parameters<typeof contactService.list>[0] {
    const params: Parameters<typeof contactService.list>[0] = {
      page: pageNum,
      take,
      filter: debouncedSearch || undefined,
    }
    if (form.crmFilter === "recent") {
      params.sortBy = "created_at"
      params.sortOrder = "desc"
    }
    if (form.crmFilter === "organization" && form.crmFilterOrganizationId) {
      params.organization_id = form.crmFilterOrganizationId
    }
    if (form.crmFilterCountries.length > 0) {
      params.country = form.crmFilterCountries
    }
    return params
  }

  function toggleCountry(code: string) {
    setForm((f) => {
      const set = new Set(f.crmFilterCountries)
      if (set.has(code)) set.delete(code)
      else set.add(code)
      return { ...f, crmFilterCountries: Array.from(set) }
    })
  }

  // Load contacts page 1 whenever filter/search changes
  React.useEffect(() => {
    if (form.audienceMode !== "crm") return
    let cancelled = false
    setLoading(true)
    setPage(1)

    contactService.list(buildListParams(1, PAGE_SIZE))
      .then((res) => {
        if (cancelled) return
        setContacts(res.data)
        setTotal(res.total)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.audienceMode, form.crmFilter, form.crmFilterOrganizationId, form.crmFilterCountries, debouncedSearch])

  // Selección por bloques — para audiencias grandes que exceden el límite por campaña
  // (ej: 16.000 contactos de Chile hay que mandarlos en tandas de a 3.000 en días distintos).
  // Bloque 1 = los primeros `blockSize` que matchean el filtro actual, Bloque 2 = los siguientes, etc.
  async function selectBlock() {
    if (blockNumber < 1 || blockSize < 1) return
    setSelectingBlock(true)
    try {
      const res = await contactService.list(buildListParams(blockNumber, blockSize))
      if (res.data.length === 0) {
        notify.error({ title: "Bloque vacío", description: "No hay contactos en ese rango con el filtro actual." })
        return
      }
      setForm((f) => ({ ...f, selectedContactIds: res.data.map((c) => c.id) }))
      notify.success({
        title: `${res.data.length} contactos seleccionados`,
        description: `Bloque ${blockNumber} de ${blockSize} — reemplazó la selección anterior.`,
      })
    } catch {
      notify.error({ title: "No se pudo seleccionar el bloque", description: "Intenta de nuevo." })
    } finally {
      setSelectingBlock(false)
    }
  }

  function handleLoadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    contactService.list(buildListParams(nextPage, PAGE_SIZE))
      .then((res) => {
        setContacts((prev) => [...prev, ...res.data])
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  const selectedSet = new Set(form.selectedContactIds)
  const allLoadedSelected = contacts.length > 0 && contacts.every((c) => selectedSet.has(c.id))
  const hasMore = contacts.length < total

  function toggleContact(id: number) {
    setForm((f) => {
      const set = new Set(f.selectedContactIds)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return { ...f, selectedContactIds: Array.from(set) }
    })
  }

  function selectAllLoaded() {
    setForm((f) => {
      const set = new Set(f.selectedContactIds)
      contacts.forEach((c) => set.add(c.id))
      return { ...f, selectedContactIds: Array.from(set) }
    })
  }

  function deselectAllLoaded() {
    setForm((f) => {
      const set = new Set(f.selectedContactIds)
      contacts.forEach((c) => set.delete(c.id))
      return { ...f, selectedContactIds: Array.from(set) }
    })
  }

  // "Seleccionar todo" antes solo agarraba lo cargado en pantalla (10 por página) —
  // con 1300 contactos eso dejaba la campaña armada con casi nadie. Acá se trae del
  // backend TODOS los que matchean el filtro/búsqueda actual, no solo lo visible.
  async function selectAllMatching() {
    if (total === 0) return
    setSelectingAll(true)
    try {
      const res = await contactService.list(buildListParams(1, total))
      setForm((f) => ({
        ...f,
        selectedContactIds: Array.from(new Set([...f.selectedContactIds, ...res.data.map((c) => c.id)])),
      }))
      notify.success({ title: `${res.data.length} contactos seleccionados`, description: "Se seleccionaron todos los que coinciden con el filtro actual." })
    } catch {
      notify.error({ title: "No se pudo seleccionar todo", description: "Intenta de nuevo." })
    } finally {
      setSelectingAll(false)
    }
  }

  function addRecipient() {
    setForm((f) => ({ ...f, customRecipients: [...f.customRecipients, emptyRecipient()] }))
  }
  function removeRecipient(id: string) {
    setForm((f) => ({ ...f, customRecipients: f.customRecipients.filter((r) => r.id !== id) }))
  }
  function updateRecipient(id: string, patch: Partial<CustomRecipient>) {
    setForm((f) => ({
      ...f,
      customRecipients: f.customRecipients.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Section title="Audiencia" description="Elige a quién le llegará esta campaña.">
        <div className="flex gap-2">
          {(
            [
              { value: "crm" as AudienceMode, label: "Contactos del CRM", icon: UsersIcon },
              { value: "custom" as AudienceMode, label: "Lista personalizada", icon: ListIcon },
            ]
          ).map((opt) => {
            const Icon = opt.icon
            const active = form.audienceMode === opt.value
            return (
              <Button
                key={opt.value}
                type="button"
                variant={active ? "default" : "outline"}
                className={cn("flex-1", active && "ring-2 ring-primary/20")}
                onClick={() => setForm((f) => ({ ...f, audienceMode: opt.value }))}
              >
                <Icon className="size-4" />
                {opt.label}
              </Button>
            )
          })}
        </div>
      </Section>

      {form.audienceMode === "crm" && (
        <Section
          title={`Contactos (${form.selectedContactIds.length} seleccionados)`}
          description="Filtra y tilda a quién le llega la campaña."
          actions={
            <>
              <Button type="button" variant="outline" size="sm" onClick={selectAllMatching} disabled={selectingAll}>
                {selectingAll
                  ? <><Loader2Icon className="size-3.5 animate-spin" /> Seleccionando...</>
                  : <><CheckCheckIcon className="size-3.5" /> Seleccionar todo ({total})</>
                }
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, selectedContactIds: [] }))}
                disabled={selectingAll}
              >
                Deseleccionar todo
              </Button>
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-60 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 rounded-lg border p-0.5">
              {(
                [
                  { value: "all" as CrmFilter, label: "Todos" },
                  { value: "recent" as CrmFilter, label: "Recientes" },
                  { value: "organization" as CrmFilter, label: "Organización" },
                ]
              ).map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={form.crmFilter === opt.value ? "default" : "ghost"}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      crmFilter: opt.value,
                      crmFilterOrganization: "",
                      crmFilterOrganizationId: null,
                    }))
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {form.crmFilter === "organization" && (
              <div className="w-48">
                <OrgAsyncSelect
                  value={form.crmFilterOrganizationId}
                  selectedName={form.crmFilterOrganization || null}
                  onChange={(org) =>
                    setForm((f) => ({
                      ...f,
                      crmFilterOrganizationId: org?.id ?? null,
                      crmFilterOrganization: org?.name ?? "",
                    }))
                  }
                />
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" className="border-dashed" />}>
                <PlusCircleIcon className="size-3.5" />
                País
                {form.crmFilterCountries.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {form.crmFilterCountries.length}
                  </Badge>
                )}
                <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-44">
                {countryCounts.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.code}
                    checked={form.crmFilterCountries.includes(c.code)}
                    onCheckedChange={() => toggleCountry(c.code)}
                  >
                    <span>{COUNTRY_LABELS[c.code] ?? c.code}</span>
                    <span className="ml-auto tabular-nums text-xs text-muted-foreground">{c.count}</span>
                  </DropdownMenuCheckboxItem>
                ))}
                {form.crmFilterCountries.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <button
                      type="button"
                      className="w-full px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setForm((f) => ({ ...f, crmFilterCountries: [] }))}
                    >
                      Limpiar filtro
                    </button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-2.5">
            <span className="text-xs text-muted-foreground">
              Audiencias grandes: selecciona en tandas para respetar los límites de envío.
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Bloque</span>
              <Input
                type="number"
                min={1}
                className="h-8 w-16"
                value={blockNumber}
                onChange={(e) => setBlockNumber(Math.max(1, Number(e.target.value) || 1))}
              />
              <span className="text-xs text-muted-foreground">de tamaño</span>
              <Input
                type="number"
                min={1}
                className="h-8 w-24"
                value={blockSize}
                onChange={(e) => setBlockSize(Math.max(1, Number(e.target.value) || 1))}
              />
              <Button type="button" variant="outline" size="sm" onClick={selectBlock} disabled={selectingBlock}>
                {selectingBlock
                  ? <><Loader2Icon className="size-3.5 animate-spin" /> Seleccionando...</>
                  : "Seleccionar bloque"
                }
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Seleccionar todos los cargados"
                      checked={allLoadedSelected}
                      onCheckedChange={(v) => (v ? selectAllLoaded() : deselectAllLoaded())}
                    />
                  </TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Organización</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2Icon className="size-4 animate-spin" /> Cargando contactos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : contacts.length ? (
                  <>
                    {contacts.map((c) => {
                      const email = getEmail(c)
                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <Checkbox
                              aria-label={`Seleccionar a ${c.name}`}
                              checked={selectedSet.has(c.id)}
                              onCheckedChange={() => toggleContact(c.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-7 shrink-0">
                                <AvatarImage src="https://github.com/shadcn.png" alt={c.name} />
                                <AvatarFallback className="text-[9px] font-semibold">
                                  {getInitials(c.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{c.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{email || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {c.organization?.name ?? "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {hasMore && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            disabled={loadingMore}
                            onClick={handleLoadMore}
                          >
                            {loadingMore
                              ? <><Loader2Icon className="size-3.5 animate-spin" /> Cargando...</>
                              : `Cargar más (${total - contacts.length} restantes)`
                            }
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                      No se encontraron contactos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Section>
      )}

      {form.audienceMode === "custom" && (
        <Section title="Lista personalizada" description="Agrega destinatarios que no están en tu CRM.">
          {form.customRecipients.length > 0 && (
            <div className="flex items-center gap-2 px-0.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              <span className="flex-1">Nombre (opcional)</span>
              <span className="flex-1">Correo</span>
              <span className="w-7" />
            </div>
          )}
          {form.customRecipients.map((r) => {
            const emailInvalid = r.email.trim().length > 0 && !isValidEmail(r.email)
            return (
              <div key={r.id} className="flex items-start gap-2">
                <Input
                  placeholder="Ej: Kevin"
                  className="flex-1"
                  value={r.name}
                  onChange={(e) => updateRecipient(r.id, { name: e.target.value })}
                />
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="kevin.collio@goxt.io"
                    className={cn(emailInvalid && "border-destructive focus-visible:ring-destructive")}
                    value={r.email}
                    onChange={(e) => updateRecipient(r.id, { email: e.target.value })}
                  />
                  {emailInvalid && (
                    <p className="text-xs text-destructive">Correo inválido</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-1 text-muted-foreground"
                  onClick={() => removeRecipient(r.id)}
                  aria-label="Eliminar destinatario"
                >
                  <Trash2Icon />
                </Button>
              </div>
            )
          })}
          <Button type="button" variant="outline" size="sm" onClick={addRecipient}>
            <PlusIcon className="size-3.5" /> Agregar destinatario
          </Button>
        </Section>
      )}
    </div>
  )
}
