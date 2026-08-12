"use client"

import * as React from "react"
import { FileTextIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from "@/components/ui/section"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { TemplateBlockEditor } from "./TemplateBlockEditor"

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

interface Props {
  open:            boolean
  onOpenChange:    (open: boolean) => void
  initialTitle?:   string
  initialContent?: string
  onSave:          (data: { title: string; content: string }) => void
}

export function EditBlockSheet({ open, onOpenChange, initialTitle, initialContent, onSave }: Props) {
  const [title, setTitle]     = React.useState(initialTitle ?? "")
  const [content, setContent] = React.useState(initialContent ?? "")

  React.useEffect(() => {
    if (open) {
      setTitle(initialTitle ?? "")
      setContent(initialContent ?? "")
    }
  }, [open, initialTitle, initialContent])

  function handleSave() {
    onSave({ title: title.trim(), content })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        className="flex w-full! flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="space-y-0.5">
            <SheetTitle>Bloque</SheetTitle>
            <SheetDescription>Título opcional y contenido de este bloque.</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Body */}
        {open && (
          <div className="flex-1 overflow-y-auto p-5">
            <Section title="Contenido del Bloque" description="Título opcional y el texto que se imprimirá en la plantilla." icon={FileTextIcon}>
              <div className="space-y-1.5">
                <Label className={FIELD_LABEL}>Título (opcional)</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Condiciones Comerciales"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className={FIELD_LABEL}>Contenido</Label>
                <TemplateBlockEditor value={content} onChange={setContent} />
              </div>
            </Section>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Guardar bloque
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
