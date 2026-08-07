"use client"

import * as React from "react"
import { LoaderCircleIcon, XIcon, ZapIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { widgetAIService } from "@/services/widget-ai.service"
import type { WidgetAIRaw } from "@/types/widget-ai"

interface AgentPickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  currentAgentId: number | null
  onConfirm: (agentId: number) => Promise<void>
}

export function AgentPickerSheet({ open, onOpenChange, title, currentAgentId, onConfirm }: AgentPickerSheetProps) {
  const [loading, setLoading] = React.useState(true)
  const [widgets, setWidgets] = React.useState<WidgetAIRaw[]>([])
  const [selectedId, setSelectedId] = React.useState<number | null>(currentAgentId)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setSelectedId(currentAgentId)
    setLoading(true)
    widgetAIService
      .list({ is_active: true, take: 100 })
      .then((page) => setWidgets(page.data))
      .finally(() => setLoading(false))
  }, [open, currentAgentId])

  async function handleConfirm() {
    if (!selectedId || selectedId === currentAgentId) return
    setSaving(true)
    try {
      await onConfirm(selectedId)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 460, padding: 0, gap: 0 }} className="w-full">
        <div className="flex items-start justify-between border-b p-5">
          <div className="space-y-0.5">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>Elige qué widget IA (agente) va a responder los mensajes entrantes.</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={() => onOpenChange(false)} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <LoaderCircleIcon className="size-5 animate-spin" />
            </div>
          ) : widgets.length === 0 ? (
            <div className="rounded-lg border border-dashed py-6 text-center">
              <p className="text-sm text-muted-foreground">Aún no tienes ningún Widget IA creado.</p>
              <p className="mt-1 text-xs text-muted-foreground">Crea uno primero desde Marketing → Widgets IA.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {widgets.map((widget) => {
                return (
                  <button
                    key={widget.id}
                    type="button"
                    onClick={() => setSelectedId(widget.id)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedId === widget.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        selectedId === widget.id ? "border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {selectedId === widget.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <span
                      className="mt-0.5 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: widget.brand_color || "#0F172A" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{widget.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {widget.is_active ? "Activo" : "Inactivo"} · {widget.document_count} documento{widget.document_count === 1 ? "" : "s"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {(widget.used_in?.length ?? 0) > 0 ? `También en: ${widget.used_in!.join(", ")}` : "Sin usar en otros canales"}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={saving || !selectedId || selectedId === currentAgentId}
            onClick={handleConfirm}
          >
            {saving ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ZapIcon className="size-4" />}
            Usar este agente
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
