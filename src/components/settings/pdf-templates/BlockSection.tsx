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
import { GripVerticalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EditBlockSheet } from "./EditBlockSheet"

export interface BlockDraft {
  id:      string
  title:   string
  content: string
}

function stripHtml(html: string): string {
  if (typeof window === "undefined" || !html.trim()) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim()
}

interface Props {
  blocks:   BlockDraft[]
  onChange: (blocks: BlockDraft[]) => void
}

export function BlockSection({ blocks, onChange }: Props) {
  const [editTarget, setEditTarget] = React.useState<BlockDraft | "new" | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(blocks, oldIndex, newIndex))
  }

  function handleRemove(id: string) {
    onChange(blocks.filter((b) => b.id !== id))
  }

  function handleSave(data: { title: string; content: string }) {
    if (editTarget === "new") {
      onChange([...blocks, { id: crypto.randomUUID(), ...data }])
    } else if (editTarget) {
      onChange(blocks.map((b) => (b.id === editTarget.id ? { ...b, ...data } : b)))
    }
    setEditTarget(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditTarget("new")}>
          <PlusIcon className="size-3.5" /> Agregar bloque
        </Button>
      </div>

      {blocks.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          Sin bloques todavía.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {blocks.map((block) => (
              <SortableBlockRow
                key={block.id}
                block={block}
                onEdit={() => setEditTarget(block)}
                onRemove={() => handleRemove(block.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <EditBlockSheet
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        initialTitle={editTarget && editTarget !== "new" ? editTarget.title : undefined}
        initialContent={editTarget && editTarget !== "new" ? editTarget.content : undefined}
        onSave={handleSave}
      />
    </div>
  )
}

function SortableBlockRow({ block, onEdit, onRemove }: { block: BlockDraft; onEdit: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const preview = React.useMemo(() => stripHtml(block.content), [block.content])

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-2 rounded-md border bg-background p-2", isDragging && "opacity-50")}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Reordenar"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {block.title || <span className="font-normal text-muted-foreground italic">(sin título)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {preview || <span className="italic">(sin contenido)</span>}
        </p>
      </div>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Editar bloque">
        <PencilIcon className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Eliminar bloque">
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  )
}
