"use client"

import * as React from "react"
import { AlertTriangleIcon, LoaderCircleIcon, SearchIcon, UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { contactService } from "@/services/contact.service"
import { notify } from "@/lib/notify"
import { getInitials } from "@/lib/table-utils"
import type { Person } from "@/types/contact"

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  orgId:        number
  orgName:      string
  onSuccess?:   () => void
}

export function LinkContactSheet({ open, onOpenChange, orgId, orgName, onSuccess }: Props) {
  const [search,      setSearch]      = React.useState("")
  const [results,     setResults]     = React.useState<Person[]>([])
  const [selected,    setSelected]    = React.useState<Set<number>>(new Set())
  const [searching,   setSearching]   = React.useState(false)
  const [submitting,  setSubmitting]  = React.useState(false)
  const [sessionKey,  setSessionKey]  = React.useState(0)

  // Reset al abrir — sessionKey siempre cambia aunque search ya fuera ""
  React.useEffect(() => {
    if (!open) return
    setSearch("")
    setResults([])
    setSelected(new Set())
    setSessionKey((k) => k + 1)
  }, [open])

  // Búsqueda con debounce — sessionKey garantiza que dispare al abrir
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await contactService.list({ filter: search || undefined, take: 20 })
        if (!cancelled) setResults(res.data.filter((p) => p.organization_id !== orgId))
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [search, orgId, sessionKey])

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleLink() {
    if (selected.size === 0) return
    setSubmitting(true)
    const t0 = performance.now()
    console.log(`[contact] linkToOrg batch start count=${selected.size} orgId=${orgId}`)
    try {
      await Promise.all([...selected].map((id) => contactService.linkToOrg(id, orgId)))
      console.log(`[contact] linkToOrg batch OK → ${(performance.now() - t0).toFixed(1)}ms`)
      const count = selected.size
      notify.success({
        title: count === 1 ? "Contacto vinculado" : `${count} contactos vinculados`,
        description: `Asociados a ${orgName} correctamente.`,
      })
      onSuccess?.()
      onOpenChange(false)
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo vincular el contacto." })
    } finally {
      setSubmitting(false)
    }
  }

  const count = selected.size

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        style={{ maxWidth: 460, display: "flex", flexDirection: "column", gap: 0, padding: 0 }}
      >
        {/* Header */}
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Vincular contacto</SheetTitle>
          <SheetDescription>
            Selecciona contactos para asociar a <span className="font-medium text-foreground">{orgName}</span>.
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="border-b px-4 py-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-sm"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {searching ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <UserIcon className="size-8 opacity-30" />
              <p>{search ? `Sin resultados para "${search}"` : "Sin contactos disponibles."}</p>
            </div>
          ) : (
            <div className="divide-y">
              {results.map((contact) => {
                const isSelected  = selected.has(contact.id)
                const hasOtherOrg = !!contact.organization

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggle(contact.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 data-[selected=true]:bg-primary/5"
                    data-selected={isSelected}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(contact.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    />
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src="https://github.com/shadcn.png" alt={contact.name} />
                      <AvatarFallback className="text-xs font-semibold">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-snug">{contact.name}</p>
                      {hasOtherOrg ? (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
                          <AlertTriangleIcon className="size-3 shrink-0" />
                          Pertenece a &ldquo;{contact.organization!.name}&rdquo; → Se moverá
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/60">Sin organización</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t px-5 py-4">
          <span className="text-sm text-muted-foreground">
            {count > 0 ? `${count} seleccionado${count !== 1 ? "s" : ""}` : "Ninguno seleccionado"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button disabled={count === 0 || submitting} onClick={handleLink}>
              {submitting && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
              {count > 0 ? `Vincular ${count}` : "Vincular"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
