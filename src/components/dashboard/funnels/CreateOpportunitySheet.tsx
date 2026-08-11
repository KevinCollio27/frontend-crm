"use client"

import * as React from "react"
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ListPlusIcon,
  LoaderCircleIcon,
  PlusIcon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CollapsibleSection } from "@/components/ui/collapsible-section"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Section } from "@/components/ui/section"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/table-utils"
import type { OrganizationOption } from "@/services/organization.service"
import { OrgAsyncSelect } from "@/components/shared/OrgAsyncSelect"
import { ContactAsyncSelect, type ContactPickerOption } from "@/components/shared/ContactAsyncSelect"
import { teamService } from "@/services/team.service"
import { flowService } from "@/services/flow.service"
import { currencyService } from "@/services/currency.service"
import { opportunityService } from "@/services/opportunity.service"
import { catalogService, activeOptions } from "@/services/catalog.service"
import { opportunityNotify } from "@/lib/notify"
import { CreateContactSheet } from "@/components/dashboard/contacts/CreateContactSheet"
import { CreateOrganizationSheet } from "@/components/dashboard/organizations/CreateOrganizationSheet"
import { useSessionStore } from "@/store/session.store"
import type { Flow } from "@/types/flow"
import type { CurrencyRaw } from "@/types/currency"
import type { CatalogOption } from "@/types/catalog"
import { CURRENCY_FLAG } from "@/lib/currency-utils"

// ─── Constants ────────────────────────────────────────────────────────────────

interface PickerUser    { id: number; name: string; avatarUrl: string | null }

const CURRENCY_LOCALE: Record<string, string> = {
  CLP: "es-CL",
  USD: "en-US",
  ARS: "es-AR",
  COP: "es-CO",
  MXN: "es-MX",
  PEN: "es-PE",
  BRL: "pt-BR",
  EUR: "es-ES",
}

const CURRENCY_SYMBOL: Record<string, string> = {
  CLP: "$",
  USD: "$",
  ARS: "$",
  COP: "$",
  MXN: "$",
  PEN: "S/.",
  BRL: "R$",
  EUR: "€",
}

function formatAmount(raw: string, currencyCode: string): string {
  if (!raw) return ""
  const num = parseInt(raw, 10)
  if (isNaN(num)) return ""
  const locale = CURRENCY_LOCALE[currencyCode] ?? "es-CL"
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(num)
}

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

// ─── Entity pickers ───────────────────────────────────────────────────────────

function EntityPickerBase<T extends { id: number; name: string }>({
  items,
  value,
  onChange,
  placeholder,
  renderRow,
  renderSelected,
  search,
  onSearchChange,
  searching,
}: {
  items:           T[]
  value:           T | null
  onChange:        (item: T | null) => void
  placeholder:     string
  renderRow:       (item: T) => React.ReactNode
  renderSelected:  (item: T) => React.ReactNode
  search:          string
  onSearchChange:  (q: string) => void
  searching?:      boolean
}) {
  const [open, setOpen]           = React.useState(false)
  const [dropStyle, setDropStyle] = React.useState<React.CSSProperties>({})
  const triggerRef                = React.useRef<HTMLButtonElement>(null)
  const containerRef              = React.useRef<HTMLDivElement>(null)

  function handleOpen() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom
      const estimated  = 300
      if (spaceBelow < estimated && r.top > estimated) {
        setDropStyle({ bottom: window.innerHeight - r.top + 6, left: r.left, width: r.width })
      } else {
        setDropStyle({ top: r.bottom + 6, left: r.left, width: r.width })
      }
    }
    setOpen((o) => !o)
  }

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border bg-transparent px-3 py-2 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          open && "border-ring ring-3 ring-ring/50"
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-2", value ? "text-foreground" : "text-muted-foreground")}>
          {value ? renderSelected(value) : placeholder}
        </span>
        <ChevronDownIcon className={cn("ml-2 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="fixed z-50 rounded-lg border bg-popover text-popover-foreground shadow-md" style={dropStyle}>
          <div className="border-b p-1.5">
            <input
              autoFocus
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {searching ? (
              <div className="flex justify-center py-4">
                <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Sin resultados</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onChange(item); setOpen(false) }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    value?.id === item.id && "bg-accent/50"
                  )}
                >
                  <CheckIcon className={cn("size-3.5 shrink-0 opacity-0", value?.id === item.id && "opacity-100")} />
                  {renderRow(item)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ContactAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  return (
    <Avatar className="size-6 shrink-0">
      <AvatarImage src={avatarUrl ?? "https://github.com/shadcn.png"} alt={name} />
      <AvatarFallback className="text-[10px] font-semibold">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}

function ResponsiblePicker({ value, onChange }: { value: PickerUser | null; onChange: (v: PickerUser | null) => void }) {
  const [search, setSearch]   = React.useState("")
  const [all, setAll]         = React.useState<PickerUser[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    teamService.list({ take: 100, is_active: true })
      .then((res) => {
        if (!cancelled) setAll(res.data.map((m) => ({ id: m.user_id, name: m.user.name, avatarUrl: m.user.avatar_url })))
      })
      .catch(() => { if (!cancelled) setAll([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = all.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <EntityPickerBase
      items={filtered}
      value={value}
      onChange={onChange}
      placeholder="Selecciona un responsable"
      search={search}
      onSearchChange={setSearch}
      searching={loading}
      renderSelected={(u) => (
        <>
          <ContactAvatar name={u.name} avatarUrl={u.avatarUrl} />
          <span className="truncate">{u.name}</span>
        </>
      )}
      renderRow={(u) => (
        <>
          <ContactAvatar name={u.name} avatarUrl={u.avatarUrl} />
          <span>{u.name}</span>
        </>
      )}
    />
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateOpportunitySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultFlowId?: number
  defaultStageId?: number
  opportunityId?: number
  onSuccess?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateOpportunitySheet({
  open,
  onOpenChange,
  defaultFlowId,
  defaultStageId,
  opportunityId,
  onSuccess,
}: CreateOpportunitySheetProps) {
  const isEditMode = !!opportunityId
  const currentUser = useSessionStore((s) => s.user)

  // ── Form state ───────────────────────────────────────────────────────────────
  const [name, setName]               = React.useState("")
  const [flows, setFlows]             = React.useState<Flow[]>([])
  const [flowId, setFlowId]           = React.useState<number | null>(null)
  const [stageId, setStageId]         = React.useState<number | null>(null)
  const [amountRaw, setAmountRaw]     = React.useState("")
  const [currencyId, setCurrencyId]   = React.useState<number | null>(null)
  const [currencies, setCurrencies]   = React.useState<CurrencyRaw[]>([])
  const [contact, setContact]         = React.useState<ContactPickerOption | null>(null)
  const [organization, setOrganization] = React.useState<OrganizationOption | null>(null)
  const [priorityOptionId, setPriorityOptionId] = React.useState<number | null>(null)
  const [priorityLabelId, setPriorityLabelId]   = React.useState<number | null>(null)
  const [priorityOptions, setPriorityOptions]   = React.useState<CatalogOption[]>([])
  const [description, setDescription] = React.useState("")
  const [responsible, setResponsible] = React.useState<PickerUser | null>(null)
  const [closeDate, setCloseDate]     = React.useState("")
  const [createContactOpen, setCreateContactOpen] = React.useState(false)
  const [createOrgOpen, setCreateOrgOpen]         = React.useState(false)
  const [isLoading, setIsLoading]     = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // ── Derived values ────────────────────────────────────────────────────────────
  const selectedCurrency = currencies.find((c) => c.id === currencyId)
  const currencyCode     = selectedCurrency?.code ?? "CLP"
  const currencySymbol   = CURRENCY_SYMBOL[currencyCode] ?? "$"

  const currencyOptions = currencies.map((c) => ({
    value: String(c.id),
    label: c.code,
    flag:  CURRENCY_FLAG[c.code],
  }))

  const stages = React.useMemo(() => {
    const flow = flows.find((f) => f.id === flowId)
    return (flow?.flow_stage ?? []).slice().sort((a, b) => a.order_number - b.order_number)
  }, [flows, flowId])

  // ── Data loading ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setIsLoading(true)

    const t0 = performance.now()
    console.group(`[opp:sheet] loading (${opportunityId ? `edit #${opportunityId}` : "create"})`)

    Promise.all([
      flowService.all().then((r) => { console.log(`  flows       → ${(performance.now() - t0).toFixed(0)}ms`); return r }),
      currencyService.list().then((r) => { console.log(`  currencies  → ${(performance.now() - t0).toFixed(0)}ms`); return r }),
      catalogService.getLabelOptions("priority").then((r) => { console.log(`  priority    → ${(performance.now() - t0).toFixed(0)}ms`); return r }),
      opportunityId
        ? opportunityService.getById(opportunityId).then((r) => { console.log(`  detail      → ${(performance.now() - t0).toFixed(0)}ms`); return r })
        : Promise.resolve(null),
    ])
      .then(([allFlows, allCurrencies, labels, detail]) => {
        if (cancelled) return
        console.log(`[opp:sheet] all ready → ${(performance.now() - t0).toFixed(0)}ms`)
        console.groupEnd()

        setFlows(allFlows)
        setCurrencies(allCurrencies)

        const priorityLabel = labels.find((l) => l.key === "priority") ?? null
        const options = priorityLabel ? activeOptions(priorityLabel) : []
        setPriorityOptions(options)
        setPriorityLabelId(priorityLabel?.id ?? null)

        if (detail) {
          // Edit mode: pre-fill form
          setName(detail.name)
          setDescription(detail.description ?? "")
          setFlowId(detail.flow_id)
          if (detail.flow_stage_id) setStageId(detail.flow_stage_id)
          if (detail.person) {
            setContact({
              id:           detail.person.id,
              name:         detail.person.name,
              organization: detail.organization
                ? { id: detail.organization.id, name: detail.organization.name }
                : null,
            })
          }
          if (detail.organization) {
            setOrganization({ id: detail.organization.id, name: detail.organization.name })
          }
          if (detail.planned_clousure_date) {
            setCloseDate(detail.planned_clousure_date.slice(0, 10))
          }
          const costEntry = detail.opportunity_net_cost[0]
          if (costEntry) {
            setAmountRaw(String(costEntry.value))
            if (costEntry.currency) setCurrencyId(costEntry.currency.id)
          } else {
            const defaultCurrency = allCurrencies.find((c) => c.code === "CLP") ?? allCurrencies[0]
            if (defaultCurrency) setCurrencyId(defaultCurrency.id)
          }
          const mainResp = detail.opportunity_responsible.find((r) => r.is_main) ?? detail.opportunity_responsible[0]
          if (mainResp?.users) setResponsible({ id: mainResp.users.id, name: mainResp.users.name, avatarUrl: mainResp.users.avatar_url })
          const priorityDetail = detail.opportunity_detail.find((d) => d.label?.key === "priority")
          if (priorityDetail && options.length > 0) {
            const match =
              options.find((o) => o.id === priorityDetail.option_id) ??
              options.find((o) => o.value === priorityDetail.option) ??
              options.find((o) => o.value === priorityDetail.value)
            if (match) setPriorityOptionId(match.id)
          }
        } else {
          // Create mode: pre-select flow and currency
          const initialFlowId =
            defaultFlowId ??
            allFlows.find((f) => f.is_default)?.id ??
            allFlows[0]?.id ??
            null
          setFlowId(initialFlowId)
          if (defaultStageId) {
            setStageId(defaultStageId)
          } else if (initialFlowId) {
            const flow = allFlows.find((f) => f.id === initialFlowId)
            const firstStage = flow?.flow_stage
              .slice()
              .sort((a, b) => a.order_number - b.order_number)[0]
            setStageId(firstStage?.id ?? null)
          }
          const defaultCurrency = allCurrencies.find((c) => c.code === "CLP") ?? allCurrencies[0]
          if (defaultCurrency) setCurrencyId(defaultCurrency.id)
          if (currentUser) {
            setResponsible({ id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatar_url ?? null })
          }
        }
      })
      .catch((err) => { console.error("[opp:sheet] load error", err); console.groupEnd() })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [open, opportunityId, defaultFlowId, defaultStageId])

  // ── Handlers ──────────────────────────────────────────────────────────────────
  function handleContactChange(c: ContactPickerOption | null) {
    setContact(c)
    if (c?.organization) setOrganization({ id: c.organization.id, name: c.organization.name })
  }

  function handleFlowChange(id: string | null) {
    if (!id) return
    const numId = parseInt(id, 10)
    setFlowId(numId)
    const flow = flows.find((f) => f.id === numId)
    const firstStage = flow?.flow_stage.slice().sort((a, b) => a.order_number - b.order_number)[0]
    setStageId(firstStage?.id ?? null)
  }

  function handleClose() {
    onOpenChange(false)
    setName("")
    setFlowId(null)
    setStageId(null)
    setAmountRaw("")
    setCurrencyId(null)
    setContact(null)
    setOrganization(null)
    setPriorityOptionId(null)
    setDescription("")
    setResponsible(null)
    setCloseDate("")
    setCreateContactOpen(false)
    setCreateOrgOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !flowId || !stageId) return
    setIsSubmitting(true)
    const t0 = performance.now()
    const nameValue = name.trim()
    const op = isEditMode ? `PUT /opportunity/${opportunityId}` : "POST /opportunity"
    console.log(`[opp:submit] ${op} starting…`)
    try {
      const priorityItem =
        priorityOptionId !== null && priorityLabelId !== null
          ? [{
              id:       priorityOptionId,
              label_id: priorityLabelId,
              option:   priorityOptions.find((o) => o.id === priorityOptionId)?.value ?? "",
            }]
          : []

      const payload = {
        name:                 nameValue,
        flow_id:              flowId,
        flow_stage_id:        stageId,
        person_id:            contact?.id ?? null,
        organization_id:      organization?.id ?? null,
        plannedClousureDate:  closeDate || null,
        description:          description.trim() || null,
        net_cost:             amountRaw ? parseInt(amountRaw, 10) : null,
        netCostCurrencyId:    amountRaw && currencyId ? currencyId : null,
        responsible:          responsible ? [{ id: responsible.id, isMain: true }] : [],
        priority:             priorityItem,
      }

      if (isEditMode) {
        await opportunityService.update(opportunityId!, payload)
        opportunityNotify.updated(nameValue)
      } else {
        await opportunityService.create(payload)
        opportunityNotify.created(nameValue)
      }

      console.log(`[opp:submit] done → ${(performance.now() - t0).toFixed(0)}ms`)
      onSuccess?.()
      handleClose()
    } catch (err) {
      console.error(`[opp:submit] error → ${(performance.now() - t0).toFixed(0)}ms`, err)
      opportunityNotify.error()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Si la oportunidad ya trae algo cargado acá (modo edición), la sección arranca
  // expandida — si no, colapsada, ya que en la práctica casi nunca se usan.
  const hasAdditionalData = !!(amountRaw || priorityOptionId || responsible || closeDate || description)

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        className="w-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b p-5">
          <div className="space-y-0.5">
            <SheetTitle>{isEditMode ? "Editar Oportunidad" : "Crear Nueva Oportunidad"}</SheetTitle>
            <SheetDescription>
              {isEditMode
                ? "Modifica los datos de esta oportunidad."
                : "Añade una nueva oportunidad de negocio a tu CRM."}
            </SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <form id="create-opportunity-form" onSubmit={handleSubmit} className="space-y-5 p-5">

            <Section title="Información de la Oportunidad" description="Datos principales del negocio." icon={TrendingUpIcon}>
              {/* Nombre */}
              <div className="space-y-1.5">
                <Label htmlFor="opp-name" className={FIELD_LABEL}>
                  Nombre de la Oportunidad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="opp-name"
                  placeholder="Ej. Software de Cierre y Soporte Q3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Embudo + Etapa */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Embudo</Label>
                  <Select
                    value={flowId ? String(flowId) : ""}
                    onValueChange={handleFlowChange}
                    disabled={flows.length === 0}
                  >
                    <SelectTrigger className="w-full" aria-label="Embudo">
                      <SelectValue placeholder="Selecciona un embudo">
                        {(v: string) => flows.find((f) => String(f.id) === v)?.name ?? v}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {flows.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Etapa de Negocio</Label>
                  <Select
                    value={stageId ? String(stageId) : ""}
                    onValueChange={(v) => { if (v) setStageId(parseInt(v, 10)) }}
                    disabled={!flowId || stages.length === 0}
                  >
                    <SelectTrigger className="w-full" aria-label="Etapa de negocio">
                      <SelectValue placeholder="Selecciona una etapa">
                        {(v: string) => stages.find((s) => String(s.id) === v)?.name ?? v}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {stages.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contacto + Organización — ligados: elegir contacto autocompleta su organización */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex min-w-0 items-center justify-between gap-1">
                    <Label className={FIELD_LABEL}>
                      Contacto CRM <span className="text-destructive">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-5 shrink-0 px-1.5 text-muted-foreground"
                      onClick={() => setCreateContactOpen(true)}
                    >
                      <PlusIcon data-icon="inline-start" />
                      Crear
                    </Button>
                  </div>
                  <ContactAsyncSelect
                    value={contact?.id ?? null}
                    selectedName={contact?.name ?? null}
                    onChange={handleContactChange}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex min-w-0 items-center justify-between gap-1">
                    <Label className={FIELD_LABEL}>Organización / Empresa</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-5 shrink-0 px-1.5 text-muted-foreground"
                      onClick={() => setCreateOrgOpen(true)}
                    >
                      <PlusIcon data-icon="inline-start" />
                      Crear
                    </Button>
                  </div>
                  <OrgAsyncSelect
                    value={organization?.id ?? null}
                    selectedName={organization?.name ?? null}
                    onChange={setOrganization}
                  />
                </div>
              </div>
            </Section>

            <CollapsibleSection
              title="Información Adicional"
              description="Monto, prioridad, responsable y fecha de cierre."
              icon={ListPlusIcon}
              defaultOpen={hasAdditionalData}
            >
              {/* Monto + Moneda */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Ingreso Estimado</Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <span className="text-sm font-medium leading-none">{currencySymbol}</span>
                    </InputGroupAddon>
                    <InputGroupInput
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatAmount(amountRaw, currencyCode)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "")
                        setAmountRaw(digits)
                      }}
                    />
                  </InputGroup>
                </div>

                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Moneda</Label>
                  <SearchableSelect
                    options={currencyOptions}
                    value={currencyId ? String(currencyId) : ""}
                    onChange={(v) => setCurrencyId(parseInt(v, 10))}
                    placeholder="Moneda"
                    searchPlaceholder="Buscar moneda..."
                  />
                </div>
              </div>

              {/* Prioridad */}
              {priorityOptions.length > 0 && (
                <div className="space-y-2">
                  <Label className={FIELD_LABEL}>Prioridad de Oportunidad</Label>
                  <div className="grid overflow-hidden rounded-lg border" style={{ gridTemplateColumns: `repeat(${priorityOptions.length}, 1fr)` }}>
                    {priorityOptions.map((opt, i) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPriorityOptionId(priorityOptionId === opt.id ? null : opt.id)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                          i > 0 && "border-l",
                          priorityOptionId === opt.id
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {priorityOptionId === opt.id && <CheckIcon className="size-3.5 shrink-0" />}
                        {opt.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Responsable */}
              <div className="space-y-1.5">
                <Label className={FIELD_LABEL}>Responsable de Negocio</Label>
                <ResponsiblePicker value={responsible} onChange={setResponsible} />
              </div>

              {/* Fecha de cierre */}
              <div className="space-y-1.5">
                <Label htmlFor="opp-close-date" className={FIELD_LABEL}>
                  Fecha Prevista de Cierre
                </Label>
                <InputGroup>
                  <InputGroupAddon>
                    <CalendarIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="opp-close-date"
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                  />
                </InputGroup>
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <Label htmlFor="opp-description" className={FIELD_LABEL}>
                  Descripción / Notas Comerciales
                </Label>
                <Textarea
                  id="opp-description"
                  placeholder="Identifique las necesidades del cliente, alcance, competidores clave o acuerdos preliminares..."
                  rows={3}
                  className="resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CollapsibleSection>

          </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t p-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-opportunity-form"
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting && <LoaderCircleIcon className="mr-1.5 size-3.5 animate-spin" />}
            {isEditMode ? "Guardar cambios" : "Guardar oportunidad"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    {createContactOpen && (
      <CreateContactSheet
        open
        onOpenChange={(v) => { if (!v) setCreateContactOpen(false) }}
        breadcrumb="Crear Oportunidad"
        onSuccess={(c) => {
          if (c) setContact({ id: c.id, name: c.name, organization: null })
          setCreateContactOpen(false)
        }}
      />
    )}

    {createOrgOpen && (
      <CreateOrganizationSheet
        open
        onOpenChange={(v) => { if (!v) setCreateOrgOpen(false) }}
        breadcrumb="Crear Oportunidad"
        onSuccess={(org) => {
          setOrganization({ id: org.id, name: org.name })
          setCreateOrgOpen(false)
        }}
      />
    )}
  </>
  )
}
