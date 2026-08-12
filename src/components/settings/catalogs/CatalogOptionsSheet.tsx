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
import { GripVerticalIcon, Loader2Icon, LockIcon, PencilIcon, PlusIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { catalogConfirm } from "@/lib/confirm"
import { catalogNotify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { catalogService } from "@/services/catalog.service"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import type { CatalogFormState, CatalogOption } from "./shared/form-state"

interface CatalogOptionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog?: CatalogFormState
  icon?: React.ElementType
  onChanged?: (labelId: number, key: string) => void
}

export function CatalogOptionsSheet({ open, onOpenChange, catalog, icon, onChanged }: CatalogOptionsSheetProps) {
  // Solo se refresca el catálogo del padre al cerrar (no en cada acción) — evita repetir
  // la query mientras el usuario sigue editando dentro del sheet.
  // Vive acá (no en CatalogForm) para cubrir también el cierre por click-afuera/Esc.
  const dirtyRef = React.useRef(false)

  function handleOpenChange(next: boolean) {
    if (!next && dirtyRef.current && catalog) {
      onChanged?.(catalog.labelId, catalog.key)
      dirtyRef.current = false
    }
    onOpenChange(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 500, padding: 0, gap: 0 }}
        className="w-full!"
      >
        {open && catalog && (
          <CatalogForm catalog={catalog} icon={icon} onClose={() => handleOpenChange(false)} dirtyRef={dirtyRef} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function errorMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message ?? fallback
}

function CatalogForm({
  catalog,
  icon: Icon,
  onClose,
  dirtyRef,
}: {
  catalog: CatalogFormState
  icon?: React.ElementType
  onClose: () => void
  dirtyRef: React.MutableRefObject<boolean>
}) {
  const isAdmin = useIsWorkspaceAdmin()
  const [options, setOptions] = React.useState(catalog.options)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function setPending(id: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (pending) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    setEditingId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = options.findIndex((o) => o.id === active.id)
    const newIndex = options.findIndex((o) => o.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const previous = options
    const next = arrayMove(options, oldIndex, newIndex)
    setOptions(next)

    const payload = next
      .map((o, i) => ({ id: o.id, orderNumber: i + 1 }))
      .filter((o) => !o.id.startsWith("temp-"))
      .map((o) => ({ id: Number(o.id), orderNumber: o.orderNumber }))

    const t0 = Date.now()
    console.log(`[catalog-options] reorder start count=${payload.length}`)
    try {
      await catalogService.reorderOptions(payload)
      console.log(`[catalog-options] reorder OK → ${Date.now() - t0}ms`)
      dirtyRef.current = true
    } catch (error) {
      setOptions(previous)
      catalogNotify.error(errorMessage(error, "No se pudo reordenar el catálogo."))
    }
  }

  async function handleToggle(option: CatalogOption) {
    const nextActive = !option.isActive
    setOptions((prev) => prev.map((o) => (o.id === option.id ? { ...o, isActive: nextActive } : o)))
    setPending(option.id, true)
    const t0 = Date.now()
    console.log(`[catalog-options] toggle start id=${option.id} → ${nextActive}`)
    try {
      await catalogService.updateOption({ id: Number(option.id), labelId: catalog.labelId, isActive: nextActive })
      console.log(`[catalog-options] toggle OK → ${Date.now() - t0}ms`)
      nextActive ? catalogNotify.activated(option.value) : catalogNotify.deactivated(option.value)
      dirtyRef.current = true
    } catch (error) {
      setOptions((prev) => prev.map((o) => (o.id === option.id ? { ...o, isActive: option.isActive } : o)))
      catalogNotify.error(errorMessage(error, "No se pudo actualizar la opción."))
    } finally {
      setPending(option.id, false)
    }
  }

  function addOption() {
    const id = `temp-${crypto.randomUUID()}`
    setOptions((prev) => [...prev, { id, value: "", isActive: true, isBase: false }])
    setEditingId(id)
  }

  function cancelEdit(id: string) {
    if (id.startsWith("temp-")) {
      setOptions((prev) => prev.filter((o) => o.id !== id))
    }
    setEditingId(null)
  }

  async function saveEdit(id: string, rawValue: string) {
    const value = rawValue.trim()
    if (!value) {
      catalogNotify.error("El nombre no puede estar vacío.")
      return
    }
    setPending(id, true)
    const isCreate = id.startsWith("temp-")
    const t0 = Date.now()
    console.log(`[catalog-options] ${isCreate ? "create" : "update"} start`)
    try {
      if (isCreate) {
        const created = await catalogService.createOption({
          value,
          labelId: catalog.labelId,
          orderNumber: options.length,
        })
        setOptions((prev) =>
          prev.map((o) =>
            o.id === id ? { id: String(created.id), value: created.value, isActive: created.is_active, isBase: false } : o
          )
        )
      } else {
        await catalogService.updateOption({ id: Number(id), value, labelId: catalog.labelId })
        setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, value } : o)))
      }
      console.log(`[catalog-options] ${isCreate ? "create" : "update"} OK → ${Date.now() - t0}ms`)
      isCreate ? catalogNotify.created() : catalogNotify.updated()
      dirtyRef.current = true
      setEditingId(null)
    } catch (error) {
      catalogNotify.error(errorMessage(error, "No se pudo guardar la opción."))
    } finally {
      setPending(id, false)
    }
  }

  async function handleDelete(option: CatalogOption) {
    const confirmed = await catalogConfirm.deleteOption(option.value)
    if (!confirmed) return
    setPending(option.id, true)
    const t0 = Date.now()
    console.log(`[catalog-options] delete start id=${option.id}`)
    try {
      await catalogService.deleteOption(Number(option.id))
      console.log(`[catalog-options] delete OK → ${Date.now() - t0}ms`)
      setOptions((prev) => prev.filter((o) => o.id !== option.id))
      catalogNotify.deleted(option.value)
      dirtyRef.current = true
    } catch (error) {
      catalogNotify.error(errorMessage(error, "No se pudo eliminar la opción."))
    } finally {
      setPending(option.id, false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground/5">
              <Icon className="size-4.5 text-foreground" />
            </div>
          )}
          <div className="space-y-0.5">
            <SheetTitle>{catalog.name}</SheetTitle>
            <SheetDescription>
              Activa, desactiva, reordena o agrega opciones para este catálogo.
            </SheetDescription>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <XIcon />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 p-5">
          {options.length === 0 && (
            <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              Sin opciones todavía. Agrega la primera.
            </p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {options.map((option, i) => (
                  <SortableOptionRow
                    key={option.id}
                    option={option}
                    index={i}
                    isEditing={editingId === option.id}
                    isPending={pendingIds.has(option.id)}
                    dragDisabled={editingId !== null || !isAdmin}
                    canEdit={isAdmin}
                    onStartEdit={() => setEditingId(option.id)}
                    onCancelEdit={() => cancelEdit(option.id)}
                    onSaveEdit={(value) => saveEdit(option.id, value)}
                    onToggle={() => handleToggle(option)}
                    onRemove={() => handleDelete(option)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {isAdmin && (
            <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={editingId !== null}>
              <PlusIcon className="size-4" /> Agregar Etiqueta
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end border-t p-4">
        <Button type="button" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </>
  )
}

function SortableOptionRow({
  option,
  index,
  isEditing,
  isPending,
  dragDisabled,
  canEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggle,
  onRemove,
}: {
  option: CatalogOption
  index: number
  isEditing: boolean
  isPending: boolean
  dragDisabled: boolean
  canEdit: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (value: string) => void
  onToggle: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.id,
    disabled: dragDisabled,
  })
  const [draft, setDraft] = React.useState(option.value)

  React.useEffect(() => {
    if (isEditing) setDraft(option.value)
  }, [isEditing, option.value])

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
        disabled={dragDisabled}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Reordenar"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>

      {isEditing ? (
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onSaveEdit(draft)
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nombre de la etiqueta"
            className="h-8 flex-1"
            autoFocus
            disabled={isPending}
          />
          <Button type="submit" variant="ghost" size="icon-sm" disabled={isPending} aria-label="Guardar">
            {isPending ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onCancelEdit} disabled={isPending} aria-label="Cancelar">
            <XIcon className="size-4" />
          </Button>
        </form>
      ) : option.isBase ? (
        <span className="flex flex-1 items-center gap-1.5 text-sm">
          {option.value}
          <LockIcon className="size-3 text-muted-foreground" />
        </span>
      ) : (
        <span className="flex-1 text-sm">{option.value}</span>
      )}

      <Switch checked={option.isActive} onCheckedChange={onToggle} disabled={!canEdit || (isPending && !isEditing)} />

      {!isEditing && !option.isBase && canEdit && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onStartEdit}
            disabled={isPending}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Editar etiqueta"
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            disabled={isPending}
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Eliminar etiqueta"
          >
            {isPending ? <Loader2Icon className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
          </Button>
        </>
      )}
    </div>
  )
}
