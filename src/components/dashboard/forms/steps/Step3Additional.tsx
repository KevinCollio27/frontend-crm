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
  AlignLeftIcon,
  CalendarIcon,
  CheckSquareIcon,
  GripVerticalIcon,
  HashIcon,
  HeadingIcon,
  InfoIcon,
  LinkIcon,
  ListIcon,
  MapPinIcon,
  PlusIcon,
  TypeIcon,
  UploadIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CustomField, CustomFieldType, FormFormState } from "../shared/form-state"

interface Step3AdditionalProps {
  form: FormFormState
  setForm: React.Dispatch<React.SetStateAction<FormFormState>>
}

interface TypeDef {
  value: CustomFieldType
  label: string
  icon: LucideIcon
  group: "Más usados" | "Otros"
}

const FIELD_TYPES: TypeDef[] = [
  { value: "TEXT",          label: "Texto",       icon: TypeIcon,      group: "Más usados" },
  { value: "SELECT",        label: "Selector",    icon: ListIcon,      group: "Más usados" },
  { value: "TEXTAREA",      label: "Párrafo",      icon: AlignLeftIcon, group: "Más usados" },
  { value: "SECTION_TITLE", label: "Sección",      icon: HeadingIcon,   group: "Más usados" },
  { value: "FILE",          label: "Archivo",      icon: UploadIcon,    group: "Más usados" },
  { value: "BOOLEAN",       label: "Sí / No",      icon: CheckSquareIcon, group: "Más usados" },
  { value: "INFO",          label: "Informativo",  icon: InfoIcon,      group: "Más usados" },
  { value: "NUMBER",        label: "Número",       icon: HashIcon,      group: "Otros" },
  { value: "DATE",          label: "Fecha",        icon: CalendarIcon,  group: "Otros" },
  { value: "URL",           label: "Enlace",       icon: LinkIcon,      group: "Otros" },
  { value: "ADDRESS",       label: "Dirección (Google)", icon: MapPinIcon, group: "Otros" },
]

const TYPE_MAP: Record<CustomFieldType, TypeDef> = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t])) as Record<CustomFieldType, TypeDef>

const MOST_USED = FIELD_TYPES.filter((t) => t.group === "Más usados")
const OTHERS    = FIELD_TYPES.filter((t) => t.group === "Otros")

const FILE_TYPES = [
  { key: "pdf",    label: "PDF" },
  { key: "images", label: "Imágenes" },
  { key: "word",   label: "Word" },
  { key: "excel",  label: "Excel" },
] as const

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

function createField(type: CustomFieldType): CustomField {
  return { id: genId(), type, label: "", placeholder: "", required: false, options: [] }
}

export function Step3Additional({ form, setForm }: Step3AdditionalProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function addField() {
    setForm((f) => ({ ...f, customFields: [...f.customFields, createField("TEXT")] }))
  }

  function updateField(id: string, patch: Partial<CustomField>) {
    setForm((f) => ({ ...f, customFields: f.customFields.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }

  function removeField(id: string) {
    setForm((f) => ({ ...f, customFields: f.customFields.filter((c) => c.id !== id) }))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setForm((f) => {
      const oldIndex = f.customFields.findIndex((c) => c.id === active.id)
      const newIndex = f.customFields.findIndex((c) => c.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return f
      return { ...f, customFields: arrayMove(f.customFields, oldIndex, newIndex) }
    })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Section title="Adicionales" description="Campos propios de este formulario, además de Contacto/Organización/Oportunidad.">
        {form.customFields.length === 0 && (
          <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            Sin campos todavía. Agrega el primero para armar tu formulario.
          </p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={form.customFields.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {form.customFields.map((field, index) => (
                <SortableItem key={field.id} id={field.id}>
                  {(dragHandleProps) => (
                    <CustomFieldRow
                      field={field}
                      index={index}
                      dragHandleProps={dragHandleProps}
                      onChange={(patch) => updateField(field.id, patch)}
                      onRemove={() => removeField(field.id)}
                    />
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <PlusIcon className="size-4" /> Agregar Campo
        </Button>
      </Section>
    </div>
  )
}

// ─── Fila arrastrable ────────────────────────────────────────────────────────────

function SortableItem({ id, children }: { id: string; children: (dragHandleProps: Record<string, unknown>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "opacity-50")}>
      {children({ ...attributes, ...listeners })}
    </div>
  )
}

// ─── Fila de campo adicional ──────────────────────────────────────────────────────

interface CustomFieldRowProps {
  field: CustomField
  index: number
  dragHandleProps: Record<string, unknown>
  onChange: (patch: Partial<CustomField>) => void
  onRemove: () => void
}

function CustomFieldRow({ field, index, dragHandleProps, onChange, onRemove }: CustomFieldRowProps) {
  const isStatic = field.type === "SECTION_TITLE" || field.type === "INFO"
  const isMultiline = field.type === "INFO"
  const showPlaceholder = !isStatic && field.type !== "BOOLEAN" && field.type !== "FILE"
  const showRequired = !isStatic

  const namePlaceholder =
    field.type === "SECTION_TITLE" ? "Texto de la sección" :
    field.type === "INFO" ? "Texto informativo (se muestra tal cual, sin que el usuario responda)" :
    "Nombre del campo"

  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center gap-2 p-2">
        <button type="button" {...dragHandleProps} className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing" aria-label="Reordenar">
          <GripVerticalIcon className="size-4" />
        </button>
        <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>

        {isMultiline ? (
          <Textarea
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={namePlaceholder}
            rows={1}
            className="min-w-0 flex-1 text-sm"
          />
        ) : (
          <Input value={field.label} onChange={(e) => onChange({ label: e.target.value })} placeholder={namePlaceholder} className="h-8 min-w-0 flex-1" />
        )}

        {showPlaceholder && (
          <Input
            value={field.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Placeholder"
            className="h-8 min-w-0 flex-1 text-muted-foreground"
          />
        )}

        <Select value={field.type} onValueChange={(v) => onChange({ type: (v ?? "TEXT") as CustomFieldType })}>
          <SelectTrigger className="h-8 w-40 shrink-0">
            <SelectValue>{(v: string) => TYPE_MAP[v as CustomFieldType]?.label ?? v}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Más usados</SelectLabel>
              {MOST_USED.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <t.icon className="size-3.5 text-muted-foreground" /> {t.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Otros</SelectLabel>
              {OTHERS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <t.icon className="size-3.5 text-muted-foreground" /> {t.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {showRequired && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Obligatorio</span>
            <Switch checked={field.required} onCheckedChange={(v) => onChange({ required: v })} className="scale-90" />
          </div>
        )}

        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Eliminar campo">
          <XIcon className="size-4" />
        </Button>
      </div>

      {(field.type === "SELECT" || field.type === "FILE") && (
        <div className="space-y-2.5 border-t p-2">
          {field.type === "SELECT" && (
            <>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={!!field.multiple} onCheckedChange={(v) => onChange({ multiple: v })} className="scale-90" />
                Permitir elegir varias (multi-selector)
              </label>
              <OptionsEditor options={field.options} onChange={(options) => onChange({ options })} />
            </>
          )}

          {field.type === "FILE" && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Tipos de archivo aceptados</p>
              <div className="flex flex-wrap gap-1.5">
                {FILE_TYPES.map((ft) => {
                  const active = (field.accept ?? []).includes(ft.key)
                  return (
                    <button
                      key={ft.key}
                      type="button"
                      onClick={() => {
                        const prev = field.accept ?? []
                        onChange({ accept: active ? prev.filter((k) => k !== ft.key) : [...prev, ft.key] })
                      }}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-foreground/30"
                      )}
                    >
                      {ft.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Opciones (Selector) ──────────────────────────────────────────────────────────

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
