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
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
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
import { useCargoIntegration } from "@/hooks/useCargoIntegration"
import {
  LABEL_TYPES,
  labelNeedsOptions,
  type ProductFormState,
  type ProductLabel,
  type ProductLabelOption,
  type ProductLabelType,
} from "../shared/form-state"

const BASIC_TYPES = LABEL_TYPES.filter((t) => t.group === "Básico")
const CARGO_TYPES = LABEL_TYPES.filter((t) => t.group === "Cargo")

interface Step2LabelsProps {
  form: ProductFormState
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>
}

export function Step2Labels({ form, setForm }: Step2LabelsProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const { hasCargoIntegration } = useCargoIntegration()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setForm((f) => {
      const oldIndex = f.labels.findIndex((l) => l.id === active.id)
      const newIndex = f.labels.findIndex((l) => l.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return f
      return { ...f, labels: arrayMove(f.labels, oldIndex, newIndex) }
    })
  }

  function addLabel() {
    const label: ProductLabel = { id: `temp-${crypto.randomUUID()}`, name: "", type: "input", options: [] }
    setForm((f) => ({ ...f, labels: [...f.labels, label] }))
  }

  function updateLabel(id: string, patch: Partial<ProductLabel>) {
    setForm((f) => ({ ...f, labels: f.labels.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
  }

  function removeLabel(id: string) {
    setForm((f) => ({ ...f, labels: f.labels.filter((l) => l.id !== id) }))
  }

  return (
    <div className="space-y-5">
      <Section title="Etiquetas" description="Campos dinámicos que este producto tendrá al usarse en una cotización.">
        {form.labels.length === 0 && (
          <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            Sin etiquetas todavía. Agrega la primera para definir los campos del producto.
          </p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={form.labels.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {form.labels.map((label, i) => (
                <LabelRow
                  key={label.id}
                  label={label}
                  index={i}
                  hasCargoIntegration={hasCargoIntegration}
                  onUpdate={(patch) => updateLabel(label.id, patch)}
                  onRemove={() => removeLabel(label.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button type="button" variant="outline" size="sm" onClick={addLabel}>
          <PlusIcon className="size-4" /> Agregar Etiqueta
        </Button>
      </Section>
    </div>
  )
}

function LabelRow({
  label,
  index,
  hasCargoIntegration,
  onUpdate,
  onRemove,
}: {
  label: ProductLabel
  index: number
  hasCargoIntegration: boolean
  onUpdate: (patch: Partial<ProductLabel>) => void
  onRemove: () => void
}) {
  const showOptions = labelNeedsOptions(label.type)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: label.id,
  })

  function addOption() {
    const option: ProductLabelOption = { id: `temp-${crypto.randomUUID()}`, value: "" }
    onUpdate({ options: [...label.options, option] })
  }

  function updateOption(id: string, value: string) {
    onUpdate({ options: label.options.map((o) => (o.id === id ? { ...o, value } : o)) })
  }

  function removeOption(id: string) {
    onUpdate({ options: label.options.filter((o) => o.id !== id) })
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-md border bg-background",
        showOptions && "border-primary/30",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Reordenar"
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
        <Input
          value={label.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nombre de la etiqueta"
          className="h-8 flex-1"
        />
        <Select value={label.type} onValueChange={(v) => onUpdate({ type: (v as ProductLabelType) ?? "input" })}>
          <SelectTrigger className="h-8 w-44 shrink-0">
            <SelectValue>
              {(v: string) => LABEL_TYPES.find((t) => t.value === v)?.label ?? v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Básico</SelectLabel>
              {BASIC_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <t.icon className="size-3.5 text-muted-foreground" /> {t.label}
                </SelectItem>
              ))}
            </SelectGroup>
            {hasCargoIntegration && (
              <SelectGroup>
                <SelectLabel>Cargo</SelectLabel>
                {CARGO_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <t.icon className="size-3.5 text-muted-foreground" /> {t.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Eliminar etiqueta"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      {showOptions && (
        <div className="space-y-1.5 border-t p-2 pl-4">
          <p className="text-xs text-muted-foreground">Opciones</p>
          {label.options.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <Input
                value={option.value}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder="ej. Rojo"
                className="h-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeOption(option.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Eliminar opción"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addOption} className="text-muted-foreground">
            <PlusIcon className="size-3.5" /> Agregar opción
          </Button>
        </div>
      )}
    </div>
  )
}
