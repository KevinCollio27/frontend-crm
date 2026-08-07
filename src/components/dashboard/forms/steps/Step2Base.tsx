"use client"

import * as React from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Building2Icon,
  CalendarIcon,
  CompassIcon,
  DollarSignIcon,
  GlobeIcon,
  GripVerticalIcon,
  HashIcon,
  LockIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlusIcon,
  Share2Icon,
  TypeIcon,
  UserIcon,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  SOCIAL_NETWORK_LABEL,
  type ContactFieldKey,
  type ContactFieldsState,
  type FieldConfig,
  type FormFormState,
  type OpportunityFieldKey,
  type OpportunityFieldsState,
  type OrganizationFieldKey,
  type OrganizationFieldsState,
  type SocialNetwork,
} from "../shared/form-state"

interface Step2BaseProps {
  form: FormFormState
  setForm: React.Dispatch<React.SetStateAction<FormFormState>>
}

export function Step2Base({ form, setForm }: Step2BaseProps) {
  function patchContact<K extends keyof ContactFieldsState>(key: K, patch: Partial<ContactFieldsState[K]>) {
    setForm((f) => ({
      ...f,
      contact: { ...f.contact, fields: { ...f.contact.fields, [key]: { ...f.contact.fields[key], ...patch } } },
    }))
  }

  function patchOrg<K extends keyof OrganizationFieldsState>(key: K, patch: Partial<OrganizationFieldsState[K]>) {
    setForm((f) => ({
      ...f,
      organization: { ...f.organization, fields: { ...f.organization.fields, [key]: { ...f.organization.fields[key], ...patch } } },
    }))
  }

  function patchOpp<K extends keyof OpportunityFieldsState>(key: K, patch: Partial<OpportunityFieldsState[K]>) {
    setForm((f) => ({
      ...f,
      opportunity: { ...f.opportunity, fields: { ...f.opportunity.fields, [key]: { ...f.opportunity.fields[key], ...patch } } },
    }))
  }

  function renderContactRow(key: ContactFieldKey, index: number, dragHandleProps: DragHandleProps) {
    const field = form.contact.fields[key]
    const common = { index, dragHandleProps, onLabelChange: (v: string) => patchContact(key, { label: v }), onPlaceholderChange: (v: string) => patchContact(key, { placeholder: v }) }

    switch (key) {
      case "email":
        return <EntityFieldRow {...common} field={field} icon={MailIcon} onToggle={() => patchContact("email", { enabled: !field.enabled })} onRequiredToggle={() => patchContact("email", { required: !field.required })} />
      case "phone":
        return <EntityFieldRow {...common} field={field} icon={PhoneIcon} onToggle={() => patchContact("phone", { enabled: !field.enabled })} onRequiredToggle={() => patchContact("phone", { required: !field.required })} />
      case "birthdate":
        return <EntityFieldRow {...common} field={field} icon={CalendarIcon} onToggle={() => patchContact("birthdate", { enabled: !field.enabled })} onRequiredToggle={() => patchContact("birthdate", { required: !field.required })} />
      case "internal_position":
        return <EntityFieldRow {...common} field={field} icon={Building2Icon} onToggle={() => patchContact("internal_position", { enabled: !field.enabled })} onRequiredToggle={() => patchContact("internal_position", { required: !field.required })} />
      case "source":
        return (
          <EntityFieldRow {...common} field={field} icon={CompassIcon} onToggle={() => patchContact("source", { enabled: !field.enabled })} onRequiredToggle={() => patchContact("source", { required: !field.required })}>
            <OptionsEditor options={form.contact.fields.source.options} onChange={(options) => patchContact("source", { options })} />
          </EntityFieldRow>
        )
      case "social":
        return (
          <EntityFieldRow {...common} field={field} icon={Share2Icon} onToggle={() => patchContact("social", { enabled: !field.enabled })} onRequiredToggle={() => patchContact("social", { required: !field.required })}>
            <SocialNetworkSelect network={form.contact.fields.social.network} onChange={(network) => patchContact("social", { network, label: SOCIAL_NETWORK_LABEL[network] })} />
          </EntityFieldRow>
        )
    }
  }

  function renderOrgRow(key: OrganizationFieldKey, index: number, dragHandleProps: DragHandleProps) {
    const field = form.organization.fields[key]
    const common = { index, dragHandleProps, onLabelChange: (v: string) => patchOrg(key, { label: v }), onPlaceholderChange: (v: string) => patchOrg(key, { placeholder: v }) }

    switch (key) {
      case "rut":
        return <EntityFieldRow {...common} field={field} icon={HashIcon} onToggle={() => patchOrg("rut", { enabled: !field.enabled })} onRequiredToggle={() => patchOrg("rut", { required: !field.required })} />
      case "website":
        return <EntityFieldRow {...common} field={field} icon={GlobeIcon} onToggle={() => patchOrg("website", { enabled: !field.enabled })} onRequiredToggle={() => patchOrg("website", { required: !field.required })} />
      case "industry":
        return <EntityFieldRow {...common} field={field} icon={Building2Icon} onToggle={() => patchOrg("industry", { enabled: !field.enabled })} onRequiredToggle={() => patchOrg("industry", { required: !field.required })} />
      case "social":
        return (
          <EntityFieldRow {...common} field={field} icon={Share2Icon} onToggle={() => patchOrg("social", { enabled: !field.enabled })} onRequiredToggle={() => patchOrg("social", { required: !field.required })}>
            <SocialNetworkSelect network={form.organization.fields.social.network} onChange={(network) => patchOrg("social", { network, label: SOCIAL_NETWORK_LABEL[network] })} />
          </EntityFieldRow>
        )
    }
  }

  function renderOppRow(key: OpportunityFieldKey, index: number, dragHandleProps: DragHandleProps) {
    const field = form.opportunity.fields[key]
    const common = { index, dragHandleProps, onLabelChange: (v: string) => patchOpp(key, { label: v }), onPlaceholderChange: (v: string) => patchOpp(key, { placeholder: v }) }

    switch (key) {
      case "name":
        return <EntityFieldRow {...common} field={field} icon={TypeIcon} onToggle={() => patchOpp("name", { enabled: !field.enabled })} onRequiredToggle={() => patchOpp("name", { required: !field.required })} />
      case "notes":
        return <EntityFieldRow {...common} field={field} icon={MessageSquareIcon} onToggle={() => patchOpp("notes", { enabled: !field.enabled })} onRequiredToggle={() => patchOpp("notes", { required: !field.required })} />
      case "budget":
        return <EntityFieldRow {...common} field={field} icon={DollarSignIcon} onToggle={() => patchOpp("budget", { enabled: !field.enabled })} onRequiredToggle={() => patchOpp("budget", { required: !field.required })} />
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <p className="text-xs text-muted-foreground">
        Activa los campos que se muestran en el formulario público y arrastra para reordenarlos.
        Al responder se crean o actualizan automáticamente el Contacto, la Organización y la Oportunidad en tu CRM.
      </p>

      <Section title="Contacto">
        <div className="space-y-2">
          <EntityFieldRow field={form.contact.fields.name} icon={UserIcon}
            onToggle={() => {}} onRequiredToggle={() => {}}
            onLabelChange={(v) => patchContact("name", { label: v })}
            onPlaceholderChange={(v) => patchContact("name", { placeholder: v })}
          />
          <DraggableFieldList order={form.contact.order} onReorder={(order) => setForm((f) => ({ ...f, contact: { ...f.contact, order } }))} renderRow={renderContactRow} />
        </div>
      </Section>

      <Section
        title="Organización / Empresa"
        actions={
          <>
            <span className="text-xs text-muted-foreground">Solicitar datos de empresa</span>
            <Switch
              checked={form.organization.enabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, organization: { ...f.organization, enabled: v } }))}
            />
          </>
        }
      >
        {form.organization.enabled ? (
          <div className="space-y-2">
            <EntityFieldRow field={form.organization.fields.name} icon={Building2Icon}
              onToggle={() => {}} onRequiredToggle={() => {}}
              onLabelChange={(v) => patchOrg("name", { label: v })}
              onPlaceholderChange={(v) => patchOrg("name", { placeholder: v })}
            />
            <DraggableFieldList order={form.organization.order} onReorder={(order) => setForm((f) => ({ ...f, organization: { ...f.organization, order } }))} renderRow={renderOrgRow} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Actívalo para pedir datos de empresa al visitante.
          </p>
        )}
      </Section>

      <Section title="Oportunidad">
        <DraggableFieldList order={form.opportunity.order} onReorder={(order) => setForm((f) => ({ ...f, opportunity: { ...f.opportunity, order } }))} renderRow={renderOppRow} />
      </Section>
    </div>
  )
}

// ─── Lista arrastrable ───────────────────────────────────────────────────────────

type DragHandleProps = Record<string, unknown> | undefined

function DraggableFieldList<K extends string>({
  order,
  onReorder,
  renderRow,
}: {
  order: K[]
  onReorder: (order: K[]) => void
  renderRow: (key: K, index: number, dragHandleProps: DragHandleProps) => React.ReactNode
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = order.indexOf(active.id as K)
    const newIndex = order.indexOf(over.id as K)
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove(order, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {order.map((key, index) => (
            <SortableItem key={key} id={key}>
              {(dragHandleProps) => renderRow(key, index, dragHandleProps)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({ id, children }: { id: string; children: (dragHandleProps: DragHandleProps) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "opacity-50")}>
      {children({ ...attributes, ...listeners })}
    </div>
  )
}

// ─── Fila de campo de entidad ───────────────────────────────────────────────────

interface EntityFieldRowProps {
  field: FieldConfig
  icon: React.ComponentType<{ className?: string }>
  onToggle: () => void
  onRequiredToggle: () => void
  onLabelChange: (v: string) => void
  onPlaceholderChange: (v: string) => void
  index?: number
  dragHandleProps?: DragHandleProps
  children?: React.ReactNode
}

function EntityFieldRow({ field, icon: Icon, onToggle, onRequiredToggle, onLabelChange, onPlaceholderChange, index, dragHandleProps, children }: EntityFieldRowProps) {
  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center gap-2 p-2">
        {dragHandleProps ? (
          <button type="button" {...dragHandleProps} className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing" aria-label="Reordenar">
            <GripVerticalIcon className="size-4" />
          </button>
        ) : (
          <span className="size-4" />
        )}
        {index !== undefined ? (
          <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <Switch checked={field.enabled} onCheckedChange={onToggle} disabled={field.locked} />
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        {field.enabled ? (
          <>
            <Input value={field.label} onChange={(e) => onLabelChange(e.target.value)} className="h-8 min-w-0 flex-1" />
            <Input value={field.placeholder} onChange={(e) => onPlaceholderChange(e.target.value)} placeholder="Placeholder" className="h-8 min-w-0 flex-1 text-muted-foreground" />
          </>
        ) : (
          <span className="flex-1 text-sm text-muted-foreground">{field.label}</span>
        )}
        {field.locked ? (
          <Badge variant="outline" className="shrink-0 gap-1 text-[10px] font-semibold tracking-wide uppercase">
            <LockIcon className="size-3" /> Siempre activo
          </Badge>
        ) : (
          field.enabled && (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Obligatorio</span>
              <Switch checked={field.required} onCheckedChange={onRequiredToggle} className="scale-90" />
            </div>
          )
        )}
      </div>
      {field.enabled && children && (
        <div className="space-y-1.5 border-t p-2">{children}</div>
      )}
    </div>
  )
}

// ─── Opciones (Fuente de Contacto) ──────────────────────────────────────────────

function OptionsEditor({ options, onChange }: { options: string[]; onChange: (options: string[]) => void }) {
  function updateOption(i: number, value: string) {
    onChange(options.map((o, idx) => (idx === i ? value : o)))
  }
  function removeOption(i: number) {
    onChange(options.filter((_, idx) => idx !== i))
  }
  function addOption() {
    onChange([...options, ""])
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Opciones</p>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Opción ${i + 1}`} className="h-8 flex-1 text-xs" />
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeOption(i)} className="shrink-0 text-muted-foreground hover:text-destructive">
            <XIcon className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={addOption} className="text-muted-foreground">
        <PlusIcon className="size-3.5" /> Agregar opción
      </Button>
    </div>
  )
}

// ─── Selector de red social ──────────────────────────────────────────────────────

function SocialNetworkSelect({ network, onChange }: { network: SocialNetwork; onChange: (network: SocialNetwork) => void }) {
  return (
    <div className="max-w-48">
      <Select value={network} onValueChange={(v) => onChange((v ?? "linkedin") as SocialNetwork)}>
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue>{(v: string) => SOCIAL_NETWORK_LABEL[v as SocialNetwork] ?? v}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {(Object.keys(SOCIAL_NETWORK_LABEL) as SocialNetwork[]).map((n) => (
              <SelectItem key={n} value={n}>{SOCIAL_NETWORK_LABEL[n]}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
