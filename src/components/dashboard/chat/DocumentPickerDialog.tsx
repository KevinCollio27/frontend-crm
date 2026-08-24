"use client"

import * as React from "react"
import { FileTextIcon, LoaderCircleIcon, LockIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { documentService } from "@/services/document.service"
import type { AiChatConfigDocument } from "@/types/ai-chat-config"

interface DocumentPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alreadySelectedIds: number[]
  onConfirm: (documents: AiChatConfigDocument[]) => void
}

export function DocumentPickerDialog({ open, onOpenChange, alreadySelectedIds, onConfirm }: DocumentPickerDialogProps) {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [documents, setDocuments] = React.useState<AiChatConfigDocument[]>([])
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  React.useEffect(() => {
    if (!open) return
    setSelectedIds(new Set(alreadySelectedIds))
    let cancelled = false
    setLoading(true)
    documentService
      .list({ filter: debouncedSearch || undefined, take: 50 })
      .then((page) => {
        if (cancelled) return
        setDocuments(
          page.data.map((doc) => ({
            id: doc.id,
            name: doc.name,
            fileType: doc.file_type,
            category: doc.category,
            visibility: doc.visibility as "public" | "private",
          }))
        )
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debouncedSearch])

  function toggle(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    const selected = documents.filter((doc) => selectedIds.has(doc.id))
    onConfirm(selected)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar documentos</DialogTitle>
          <DialogDescription>
            Elige documentos ya cargados en el CRM para usarlos como contexto del Chat IA.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar documento..."
            className="h-8 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Sin documentos</p>
          ) : (
            documents.map((doc) => (
              <label
                key={doc.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/60"
              >
                <Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={() => toggle(doc.id)} />
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">{doc.name}</span>
                {doc.visibility === "private" && (
                  <LockIcon className="size-3.5 shrink-0 text-muted-foreground" />
                )}
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Agregar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
