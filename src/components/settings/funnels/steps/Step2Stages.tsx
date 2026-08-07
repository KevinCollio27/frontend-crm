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
import { cn } from "@/lib/utils"
import type { FunnelFormState, FunnelStage } from "../shared/form-state"

interface Step2StagesProps {
  form: FunnelFormState
  setForm: React.Dispatch<React.SetStateAction<FunnelFormState>>
}

export function Step2Stages({ form, setForm }: Step2StagesProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setForm((f) => {
      const oldIndex = f.stages.findIndex((s) => s.id === active.id)
      const newIndex = f.stages.findIndex((s) => s.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return f
      return { ...f, stages: arrayMove(f.stages, oldIndex, newIndex) }
    })
  }

  function updateStage(id: string, name: string) {
    setForm((f) => ({ ...f, stages: f.stages.map((s) => (s.id === id ? { ...s, name } : s)) }))
  }

  function removeStage(id: string) {
    setForm((f) => ({ ...f, stages: f.stages.filter((s) => s.id !== id) }))
  }

  function addStage() {
    const stage: FunnelStage = { id: `temp-${crypto.randomUUID()}`, name: "" }
    setForm((f) => ({ ...f, stages: [...f.stages, stage] }))
  }

  return (
    <div className="space-y-5">
      <Section title="Etapas" description="Arrastra para reordenar. Haz clic en el texto para editarlo.">
        {form.stages.length === 0 && (
          <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            Sin etapas todavía. Agrega la primera para definir tu proceso.
          </p>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={form.stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {form.stages.map((stage, i) => (
                <SortableStageRow
                  key={stage.id}
                  stage={stage}
                  index={i}
                  onUpdate={(name) => updateStage(stage.id, name)}
                  onRemove={() => removeStage(stage.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button type="button" variant="outline" size="sm" onClick={addStage}>
          <PlusIcon className="size-4" /> Agregar Etapa
        </Button>
      </Section>
    </div>
  )
}

function SortableStageRow({
  stage,
  index,
  onUpdate,
  onRemove,
}: {
  stage: FunnelStage
  index: number
  onUpdate: (name: string) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background p-2",
        isDragging && "opacity-50"
      )}
    >
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
        value={stage.name}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Nombre de la etapa"
        className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="Eliminar etapa"
      >
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  )
}
