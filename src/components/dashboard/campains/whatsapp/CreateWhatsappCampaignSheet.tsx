"use client"

import * as React from "react"
import {
  CheckCheckIcon,
  FileTextIcon,
  InfoIcon,
  ListIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { notify } from "@/lib/notify"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from "@/components/ui/section"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getInitials } from "@/lib/table-utils"
import { cn } from "@/lib/utils"
import { contactService } from "@/services/contact.service"
import { whatsappService } from "@/services/whatsapp.service"
import { whatsappCampaignService } from "@/services/whatsappCampaign.service"
import type { Person } from "@/types/contact"
import type { WhatsappTemplateRaw } from "@/types/whatsapp"
import { WhatsAppTemplatePreview, parseTemplateForPreview } from "@/components/settings/whatsapp-templates/WhatsAppTemplatePreview"

const STEPS: StepperStep[] = [
  { id: 1, label: "Información", icon: InfoIcon },
  { id: 2, label: "Audiencia",   icon: UsersIcon },
  { id: 3, label: "Contenido",   icon: FileTextIcon },
  { id: 4, label: "Revisión",    icon: SendIcon },
]

const CONTACT_NAME_TOKEN = "{{contact_name}}"
const PAGE_SIZE = 10

type AudienceMode = "crm" | "custom"

interface CustomRecipient {
  id: string
  name: string
  phone: string
}

function getPhone(contact: Person): string {
  const detail = contact.person_detail.find((d) => {
    const key = d.label?.key?.toLowerCase() || ""
    return key.includes("phone") || key.includes("telefono") || key.includes("celular")
  })
  return detail?.value ?? ""
}

function bodyTextOf(t: WhatsappTemplateRaw): string {
  if (t.body_text) return t.body_text
  return t.components?.find((c) => c.type === "BODY")?.text ?? ""
}

function parseVarCount(bodyText: string): number {
  const matches = [...bodyText.matchAll(/\{\{(\d+)\}\}/g)]
  if (matches.length === 0) return 0
  return Math.max(...matches.map((m) => parseInt(m[1]!)))
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateWhatsappCampaignSheet({ open, onOpenChange, onSuccess }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 1400, padding: 0, gap: 0 }} className="w-full!">
        {open && <Wizard onClose={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </SheetContent>
    </Sheet>
  )
}

function Wizard({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [step, setStep] = React.useState(1)
  const [submitting, setSubmitting] = React.useState(false)

  // Paso 1
  const [name, setName] = React.useState("")

  // Paso 2 — audiencia
  const [audienceMode, setAudienceMode] = React.useState<AudienceMode>("crm")
  const [contacts, setContacts] = React.useState<Person[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loadingContacts, setLoadingContacts] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [selectingAll, setSelectingAll] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [selectedContactIds, setSelectedContactIds] = React.useState<number[]>([])
  const [customRecipients, setCustomRecipients] = React.useState<CustomRecipient[]>([])

  // Paso 3 — contenido
  const [templates, setTemplates] = React.useState<WhatsappTemplateRaw[]>([])
  const [loadingTemplates, setLoadingTemplates] = React.useState(false)
  const [selectedTemplate, setSelectedTemplate] = React.useState<WhatsappTemplateRaw | null>(null)
  const [variableValues, setVariableValues] = React.useState<string[]>([])

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    if (audienceMode !== "crm") return
    let cancelled = false
    setLoadingContacts(true)
    setPage(1)
    contactService.list({ page: 1, take: PAGE_SIZE, filter: debouncedSearch || undefined })
      .then((res) => { if (!cancelled) { setContacts(res.data); setTotal(res.total) } })
      .finally(() => { if (!cancelled) setLoadingContacts(false) })
    return () => { cancelled = true }
  }, [audienceMode, debouncedSearch])

  React.useEffect(() => {
    setLoadingTemplates(true)
    whatsappService.getCachedTemplates({ status: "APPROVED", limit: 200 })
      .then((res) => setTemplates(res.templates))
      .finally(() => setLoadingTemplates(false))
  }, [])

  function handleLoadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    contactService.list({ page: nextPage, take: PAGE_SIZE, filter: debouncedSearch || undefined })
      .then((res) => { setContacts((prev) => [...prev, ...res.data]); setPage(nextPage) })
      .finally(() => setLoadingMore(false))
  }

  const selectedSet = new Set(selectedContactIds)
  const allLoadedSelected = contacts.length > 0 && contacts.every((c) => selectedSet.has(c.id))
  const hasMore = contacts.length < total

  function toggleContact(id: number) {
    setSelectedContactIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  function selectAllLoaded() {
    setSelectedContactIds((prev) => Array.from(new Set([...prev, ...contacts.map((c) => c.id)])))
  }
  function deselectAllLoaded() {
    const loadedIds = new Set(contacts.map((c) => c.id))
    setSelectedContactIds((prev) => prev.filter((id) => !loadedIds.has(id)))
  }
  async function selectAllMatching() {
    if (total === 0) return
    setSelectingAll(true)
    try {
      const res = await contactService.list({ page: 1, take: total, filter: debouncedSearch || undefined })
      setSelectedContactIds((prev) => Array.from(new Set([...prev, ...res.data.map((c) => c.id)])))
      notify.success({ title: `${res.data.length} contactos seleccionados` })
    } catch {
      notify.error({ title: "No se pudo seleccionar todo" })
    } finally {
      setSelectingAll(false)
    }
  }

  function addRecipient() {
    setCustomRecipients((prev) => [...prev, { id: crypto.randomUUID(), name: "", phone: "" }])
  }
  function removeRecipient(id: string) {
    setCustomRecipients((prev) => prev.filter((r) => r.id !== id))
  }
  function updateRecipient(id: string, patch: Partial<CustomRecipient>) {
    setCustomRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function selectTemplate(t: WhatsappTemplateRaw) {
    setSelectedTemplate(t)
    setVariableValues(Array.from({ length: parseVarCount(bodyTextOf(t)) }, () => ""))
  }

  const audienceCount = audienceMode === "crm"
    ? selectedContactIds.length
    : customRecipients.filter((r) => r.phone.trim()).length

  const canGoStep2 = name.trim().length > 0
  const canGoStep3 = audienceCount > 0
  const canGoStep4 = selectedTemplate !== null

  const previewBody = selectedTemplate
    ? bodyTextOf(selectedTemplate).replace(/\{\{(\d+)\}\}/g, (_, n) => {
        const v = variableValues[parseInt(n) - 1] || ""
        return v.replace(CONTACT_NAME_TOKEN, "Juan Pérez") || `[var ${n}]`
      })
    : ""

  async function handleSubmit() {
    if (!selectedTemplate) return
    setSubmitting(true)
    try {
      const result = await whatsappCampaignService.dispatch({
        name: name.trim(),
        templateName: selectedTemplate.name,
        templateLanguage: selectedTemplate.language,
        bodyText: bodyTextOf(selectedTemplate),
        audienceFilter: audienceMode === "crm" ? "crm" : "custom_list",
        personIds: audienceMode === "crm" ? selectedContactIds : undefined,
        customRecipients: audienceMode === "custom"
          ? customRecipients.filter((r) => r.phone.trim()).map((r) => ({ name: r.name.trim() || "Contacto", phone: r.phone.trim() }))
          : undefined,
        variableValues,
      })
      notify.success({ title: "Campaña en proceso", description: `Enviando a ${result.recipientCount} destinatarios.` })
      onSuccess?.()
      onClose()
    } catch (error) {
      notify.error({
        title: "No se pudo enviar la campaña",
        description: (error as { message?: string; extraMessage?: string })?.extraMessage
          ?? (error as { message?: string })?.message
          ?? "Intenta de nuevo.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <SheetTitle>Nueva campaña de WhatsApp</SheetTitle>
            <SheetDescription>Envía una plantilla aprobada a varios contactos a la vez.</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>
        <Stepper steps={STEPS} current={step} />
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        {step === 1 && (
          <div className="mx-auto max-w-2xl space-y-5">
            <Section title="Información general" description="Nombre para identificar esta campaña después.">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Lanzamiento agosto" autoFocus />
              </div>
            </Section>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-5xl space-y-5">
            <Section title="Audiencia" description="Elige a quién le llega esta campaña.">
              <div className="flex gap-2">
                {([
                  { value: "crm" as AudienceMode, label: "Contactos del CRM", icon: UsersIcon },
                  { value: "custom" as AudienceMode, label: "Lista personalizada", icon: ListIcon },
                ]).map((opt) => {
                  const Icon = opt.icon
                  const active = audienceMode === opt.value
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={active ? "default" : "outline"}
                      className={cn("flex-1", active && "ring-2 ring-primary/20")}
                      onClick={() => setAudienceMode(opt.value)}
                    >
                      <Icon className="size-4" />
                      {opt.label}
                    </Button>
                  )
                })}
              </div>
            </Section>

            {audienceMode === "crm" && (
              <Section
                title={`Contactos (${selectedContactIds.length} seleccionados)`}
                description="Solo se muestran los que tienen un teléfono cargado."
                actions={
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={selectAllMatching} disabled={selectingAll}>
                      {selectingAll ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckCheckIcon className="size-3.5" />}
                      Seleccionar todo ({total})
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedContactIds([])} disabled={selectingAll}>
                      Deseleccionar todo
                    </Button>
                  </>
                }
              >
                <div className="relative max-w-60">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={allLoadedSelected} onCheckedChange={(v) => (v ? selectAllLoaded() : deselectAllLoaded())} />
                        </TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Organización</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingContacts ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            <Loader2Icon className="mx-auto size-4 animate-spin text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : contacts.filter((c) => getPhone(c)).length ? (
                        <>
                          {contacts.filter((c) => getPhone(c)).map((c) => (
                            <TableRow key={c.id}>
                              <TableCell>
                                <Checkbox checked={selectedSet.has(c.id)} onCheckedChange={() => toggleContact(c.id)} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-7 shrink-0">
                                    <AvatarImage src="https://github.com/shadcn.png" alt={c.name} />
                                    <AvatarFallback className="text-[9px] font-semibold">{getInitials(c.name)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">{c.name}</span>
                                </div>
                              </TableCell>
                              <TableCell><span className="text-sm text-muted-foreground">{getPhone(c)}</span></TableCell>
                              <TableCell><span className="text-sm text-muted-foreground">{c.organization?.name ?? "—"}</span></TableCell>
                            </TableRow>
                          ))}
                          {hasMore && (
                            <TableRow>
                              <TableCell colSpan={4} className="py-2 text-center">
                                <Button type="button" variant="ghost" size="sm" className="w-full text-xs" disabled={loadingMore} onClick={handleLoadMore}>
                                  {loadingMore ? "Cargando..." : `Cargar más (${total - contacts.length} restantes)`}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                            Sin contactos con teléfono para este filtro.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Section>
            )}

            {audienceMode === "custom" && (
              <Section title="Lista personalizada" description="Agrega destinatarios que no están en tu CRM.">
                {customRecipients.map((r) => (
                  <div key={r.id} className="flex items-start gap-2">
                    <Input placeholder="Nombre (opcional)" className="flex-1" value={r.name} onChange={(e) => updateRecipient(r.id, { name: e.target.value })} />
                    <Input placeholder="+56912345678" className="flex-1" value={r.phone} onChange={(e) => updateRecipient(r.id, { phone: e.target.value })} />
                    <Button type="button" variant="ghost" size="icon-sm" className="mt-1 text-muted-foreground" onClick={() => removeRecipient(r.id)}>
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addRecipient}>
                  <PlusIcon className="size-3.5" /> Agregar destinatario
                </Button>
              </Section>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-2xl space-y-5">
            <Section title="Plantilla" description="Solo se muestran templates ya aprobados por Meta.">
              {loadingTemplates ? (
                <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
              ) : templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tienes templates aprobados todavía — créalos en Plantillas.</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => selectTemplate(t)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                        selectedTemplate?.name === t.name ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-medium">{t.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{bodyTextOf(t)}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 shrink-0 text-xs">{t.language}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </Section>

            {selectedTemplate && variableValues.length > 0 && (
              <Section title="Variables" description="Un valor para todos, o usa el nombre de cada contacto.">
                {variableValues.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Label className="w-14 shrink-0 text-xs text-muted-foreground">{`{{${i + 1}}}`}</Label>
                    <Input
                      value={v}
                      onChange={(e) => setVariableValues((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                      placeholder="Texto para todos los destinatarios"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setVariableValues((prev) => prev.map((x, idx) => (idx === i && !x.includes(CONTACT_NAME_TOKEN) ? `${x}${CONTACT_NAME_TOKEN}` : x)))}
                    >
                      + Nombre
                    </Button>
                  </div>
                ))}
              </Section>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="mx-auto max-w-2xl space-y-5">
            <Section title="Resumen" description="Revisa antes de enviar — no se puede deshacer.">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Campaña</p><p className="font-medium">{name}</p></div>
                <div><p className="text-xs text-muted-foreground">Destinatarios</p><p className="font-medium">{audienceCount}</p></div>
                <div><p className="text-xs text-muted-foreground">Plantilla</p><p className="font-mono font-medium">{selectedTemplate?.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Idioma</p><p className="font-medium">{selectedTemplate?.language}</p></div>
              </div>
            </Section>

            {selectedTemplate && (
              <Section title="Vista previa" description="Con datos de ejemplo — cada contacto recibe su propio nombre.">
                <WhatsAppTemplatePreview {...parseTemplateForPreview(selectedTemplate)} bodyText={previewBody} />
              </Section>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || submitting}>
            Anterior
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !canGoStep2 : step === 2 ? !canGoStep3 : !canGoStep4}
            >
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
              <SendIcon className="size-4" />
              {submitting ? "Enviando..." : `Enviar a ${audienceCount}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
