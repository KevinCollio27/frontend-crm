"use client"

import * as React from "react"
import { getAllCountries } from "countries-and-timezones"
import {
  AtSignIcon,
  CakeIcon,
  ChevronRightIcon,
  ListPlusIcon,
  LoaderCircleIcon,
  PhoneIcon,
  PlusIcon,
  Share2Icon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CollapsibleSection } from "@/components/ui/collapsible-section"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Section } from "@/components/ui/section"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { CURATED_COUNTRIES } from "@/lib/curated-countries"
import { OrgAsyncSelect } from "@/components/shared/OrgAsyncSelect"
import { activeOptions, catalogService } from "@/services/catalog.service"
import { contactService, type PersonPayload } from "@/services/contact.service"
import { notify } from "@/lib/notify"
import type { CatalogOption } from "@/types/catalog"
import { CreateOrganizationSheet } from "../organizations/CreateOrganizationSheet"
import { PHONE_CODES, COUNTRY_DIAL_CODE } from "@/lib/phone-utils"

// ─── Country options ──────────────────────────────────────────────────────────

const CURATED_SET = new Set<string>(CURATED_COUNTRIES)

const COUNTRY_OPTIONS = Object.values(getAllCountries())
  .filter((c) => CURATED_SET.has(c.id))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ value: c.id, label: c.name, flag: c.id }))

// ─── Static data ──────────────────────────────────────────────────────────────

const SOURCES: { value: string; label: string }[] = [
  { value: "linkedin",      label: "LinkedIn" },
  { value: "whatsapp",      label: "WhatsApp" },
  { value: "email",         label: "Correo Electrónico" },
  { value: "referral",      label: "Referido/Recomendación" },
  { value: "phone_call",    label: "Llamada Telefónica" },
  { value: "website",       label: "Sitio Web/Formulario" },
  { value: "instagram",     label: "Instagram" },
  { value: "facebook",      label: "Facebook" },
  { value: "event",         label: "Evento/Feria" },
  { value: "online_ads",    label: "Publicidad Online" },
  { value: "partner",       label: "Partner/Intermediario" },
  { value: "inbound_call",  label: "Llamada Entrante" },
  { value: "google_contacts", label: "Importado de Google" },
  { value: "cold_outreach", label: "Prospección en Frío" },
]

// ─── Social networks ──────────────────────────────────────────────────────────

type SocialNetwork = "linkedin" | "instagram" | "x" | "facebook"

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  linkedin:  "LinkedIn",
  instagram: "Instagram",
  x:         "X (Twitter)",
  facebook:  "Facebook",
}

function LinkedInIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function XNetworkIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

function FacebookIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

const SOCIAL_ICONS: Record<SocialNetwork, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  linkedin:  LinkedInIcon,
  instagram: InstagramIcon,
  x:         XNetworkIcon,
  facebook:  FacebookIcon,
}

const SOCIAL_COLORS: Record<SocialNetwork, string> = {
  linkedin:  "#0077B5",
  instagram: "#E1306C",
  x:         "currentColor",
  facebook:  "#1877F2",
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailEntry {
  id: string
  type: string  // option id del catálogo como string
  value: string
}

interface PhoneEntry {
  id: string
  type: string  // option id del catálogo como string
  code: string
  value: string
}

interface SocialEntry {
  id: string
  network: SocialNetwork
  value: string
}

interface CreateContactSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId?: number
  onSuccess?: (contact?: { id: number; name: string }) => void
  breadcrumb?: string
}

// ─── Shared label style ───────────────────────────────────────────────────────

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

function ContactFormSkeleton() {
  return (
    <>
      <div className="space-y-4 p-5">
        <SkeletonLine className="h-5 w-36" />
        <SkeletonLine className="h-9 w-full" />
        <SkeletonLine className="h-9 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonLine className="h-9 w-full" />
          <SkeletonLine className="h-9 w-full" />
        </div>
      </div>
      <div className="border-t" />
      <div className="space-y-4 p-5">
        <SkeletonLine className="h-5 w-44" />
        <div className="flex items-center gap-2">
          <SkeletonLine className="h-9 w-28 shrink-0" />
          <SkeletonLine className="h-9 flex-1" />
          <SkeletonLine className="size-9 shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonLine className="h-9 w-28 shrink-0" />
          <SkeletonLine className="h-9 w-20 shrink-0" />
          <SkeletonLine className="h-9 flex-1" />
          <SkeletonLine className="size-9 shrink-0" />
        </div>
      </div>
      <div className="border-t" />
      <div className="space-y-4 p-5">
        <SkeletonLine className="h-5 w-44" />
        <SkeletonLine className="h-9 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonLine className="h-9 w-full" />
          <SkeletonLine className="h-9 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonLine className="h-9 w-36 shrink-0" />
          <SkeletonLine className="h-9 flex-1" />
          <SkeletonLine className="size-9 shrink-0" />
        </div>
      </div>
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateContactSheet({ open, onOpenChange, contactId, onSuccess, breadcrumb }: CreateContactSheetProps) {
  const isEditMode = contactId !== undefined

  const [name, setName]               = React.useState("")
  const [orgId, setOrgId]             = React.useState<number | null>(null)
  const [orgName, setOrgName]         = React.useState<string | null>(null)
  const [isLoading, setIsLoading]     = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [createOrgOpen, setCreateOrgOpen] = React.useState(false)
  const [emailTypeOpts, setEmailTypeOpts] = React.useState<CatalogOption[]>([])
  const [phoneTypeOpts, setPhoneTypeOpts] = React.useState<CatalogOption[]>([])
  const [chargeOpts, setChargeOpts]       = React.useState<CatalogOption[]>([])
  const [emailLabelId, setEmailLabelId]   = React.useState<number | null>(null)
  const [phoneLabelId, setPhoneLabelId]   = React.useState<number | null>(null)
  const [chargeLabelId, setChargeLabelId] = React.useState<number | null>(null)
  const [country, setCountry]         = React.useState("CL")
  const [source, setSource]           = React.useState("")
  const [emails, setEmails]           = React.useState<EmailEntry[]>([
    { id: "1", type: "", value: "" },
  ])
  const [phones, setPhones]           = React.useState<PhoneEntry[]>([
    { id: "1", type: "", code: "+56", value: "" },
  ])
  const [role, setRole]               = React.useState("")
  const [internalRole, setInternalRole] = React.useState("")
  const [birthDate, setBirthDate]     = React.useState("")
  const [socials, setSocials]         = React.useState<SocialEntry[]>([
    { id: "1", network: "linkedin", value: "" },
  ])

  React.useEffect(() => {
    if (!open) return
    setIsLoading(true)
    Promise.all([
      catalogService.getLabelOptions(["email", "phone", "charge"]),
      contactId ? contactService.getById(contactId) : Promise.resolve(null),
    ]).then(([labels, contactData]) => {
      const emailLabel  = labels.find((l) => l.key === "email")
      const phoneLabel  = labels.find((l) => l.key === "phone")
      const chargeLabel = labels.find((l) => l.key === "charge")

      const eLabelId = emailLabel?.id ?? null
      const pLabelId = phoneLabel?.id ?? null
      const cLabelId = chargeLabel?.id ?? null
      setEmailLabelId(eLabelId)
      setPhoneLabelId(pLabelId)
      setChargeLabelId(cLabelId)

      const emailOpts  = emailLabel  ? activeOptions(emailLabel)  : []
      const phoneOpts  = phoneLabel  ? activeOptions(phoneLabel)  : []
      const chargeOpts = chargeLabel ? activeOptions(chargeLabel) : []
      setEmailTypeOpts(emailOpts)
      setPhoneTypeOpts(phoneOpts)
      setChargeOpts(chargeOpts)

      if (contactData) {
        // ── Edit mode: pre-populate from contact ──────────────────────────
        setName(contactData.name)
        setOrgId(contactData.organization_id)
        setOrgName(contactData.organization?.name ?? null)
        setCountry(contactData.pais_origen ?? "CL")
        setSource(contactData.contact_source ?? "")
        setInternalRole(contactData.internal_position ?? "")
        setBirthDate(contactData.birth_date ? contactData.birth_date.split("T")[0] : "")

        // Socials
        const newSocials: SocialEntry[] = []
        if (contactData.linkedin_url)  newSocials.push({ id: crypto.randomUUID(), network: "linkedin",  value: contactData.linkedin_url })
        if (contactData.instagram_url) newSocials.push({ id: crypto.randomUUID(), network: "instagram", value: contactData.instagram_url })
        if (contactData.twitter_url)   newSocials.push({ id: crypto.randomUUID(), network: "x",         value: contactData.twitter_url })
        if (contactData.facebook_url)  newSocials.push({ id: crypto.randomUUID(), network: "facebook",  value: contactData.facebook_url })
        setSocials(newSocials.length > 0 ? newSocials : [{ id: "1", network: "linkedin", value: "" }])

        // Emails
        const emailDetails = contactData.person_detail.filter((d) => d.label?.key === "email")
        const defaultEmailType = String(emailOpts[0]?.id ?? "")
        setEmails(
          emailDetails.length > 0
            ? emailDetails.map((d) => ({
                id: crypto.randomUUID(),
                type: String(emailOpts.find((o) => o.value === d.option)?.id ?? emailOpts[0]?.id ?? ""),
                value: d.value,
              }))
            : [{ id: "1", type: defaultEmailType, value: "" }]
        )

        // Phones
        const phoneDetails = contactData.person_detail.filter((d) => d.label?.key === "phone")
        const defaultPhoneType = String(phoneOpts[0]?.id ?? "")
        const defaultCode = COUNTRY_DIAL_CODE[contactData.pais_origen ?? "CL"] ?? "+56"
        setPhones(
          phoneDetails.length > 0
            ? phoneDetails.map((d) => ({
                id: crypto.randomUUID(),
                code: defaultCode,
                type: String(phoneOpts.find((o) => o.value === d.option)?.id ?? phoneOpts[0]?.id ?? ""),
                value: d.value,
              }))
            : [{ id: "1", type: defaultPhoneType, code: defaultCode, value: "" }]
        )

        // Charge — si el contacto no tiene cargo guardado, el selector queda vacío
        // (placeholder). Antes se preseleccionaba la primera opción del catálogo, lo que
        // hacía parecer guardado un cargo que nunca se eligió, y se grababa de verdad si
        // el usuario guardaba sin darse cuenta.
        const chargeDetail = contactData.person_detail.find((d) => d.label?.key === "charge")
        setRole(chargeDetail ? String(chargeOpts.find((o) => o.value === chargeDetail.option)?.id ?? "") : "")
      } else {
        // ── Create mode: apply defaults ───────────────────────────────────
        // Correo/teléfono sí necesitan una etiqueta preseleccionada (el catálogo define
        // el tipo, no es opcional dejarlo vacío). Cargo y Fuente quedan sin preseleccionar
        // — son opcionales, y forzar una opción hacía parecer elegido algo que no se tocó.
        if (emailOpts.length > 0) {
          setEmails((prev) => prev.map((e, i) => i === 0 && e.type === "" ? { ...e, type: String(emailOpts[0].id) } : e))
        }
        if (phoneOpts.length > 0) {
          setPhones((prev) => prev.map((p, i) => i === 0 && p.type === "" ? { ...p, type: String(phoneOpts[0].id) } : p))
        }
      }
    }).catch(() => {}).finally(() => setIsLoading(false))
  }, [open, contactId]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const code = COUNTRY_DIAL_CODE[country] ?? "+56"
    setPhones((prev) => prev.map((p) => ({ ...p, code })))
  }, [country])

  // ── email helpers ──
  function addEmail() {
    const defaultType = emailTypeOpts[0] ? String(emailTypeOpts[0].id) : ""
    setEmails((prev) => [...prev, { id: crypto.randomUUID(), type: defaultType, value: "" }])
  }
  function removeEmail(id: string) {
    setEmails((prev) => prev.filter((e) => e.id !== id))
  }
  function updateEmail(id: string, patch: Partial<EmailEntry>) {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  // ── phone helpers ──
  function addPhone() {
    const defaultType = phoneTypeOpts[0] ? String(phoneTypeOpts[0].id) : ""
    const code = COUNTRY_DIAL_CODE[country] ?? "+56"
    setPhones((prev) => [...prev, { id: crypto.randomUUID(), type: defaultType, code, value: "" }])
  }
  function removePhone(id: string) {
    setPhones((prev) => prev.filter((p) => p.id !== id))
  }
  function updatePhone(id: string, patch: Partial<PhoneEntry>) {
    setPhones((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  // ── social helpers ──
  function addSocial() {
    setSocials((prev) => [...prev, { id: crypto.randomUUID(), network: "linkedin", value: "" }])
  }
  function removeSocial(id: string) {
    setSocials((prev) => prev.filter((s) => s.id !== id))
  }
  function updateSocial(id: string, patch: Partial<SocialEntry>) {
    setSocials((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function handleClose() {
    onOpenChange(false)
    setName("")
    setOrgId(null)
    setOrgName(null)
    setCreateOrgOpen(false)
    setCountry("CL")
    setSource("")
    const defaultEmailType = emailTypeOpts[0] ? String(emailTypeOpts[0].id) : ""
    const defaultPhoneType = phoneTypeOpts[0] ? String(phoneTypeOpts[0].id) : ""
    setEmails([{ id: "1", type: defaultEmailType, value: "" }])
    setPhones([{ id: "1", type: defaultPhoneType, code: "+56", value: "" }])
    setRole("")
    setInternalRole("")
    setBirthDate("")
    setSocials([{ id: "1", network: "linkedin", value: "" }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const emailPayload = emails
        .filter((em) => em.value.trim() !== "")
        .map((em) => {
          const opt = emailTypeOpts.find((o) => String(o.id) === em.type)
          return { id: opt?.id ?? null, label_id: emailLabelId!, option: opt?.value ?? "", value: em.value }
        })

      const phonePayload = phones
        .filter((ph) => ph.value.trim() !== "")
        .map((ph) => {
          const opt = phoneTypeOpts.find((o) => String(o.id) === ph.type)
          return { id: opt?.id ?? null, label_id: phoneLabelId!, option: opt?.value ?? "", value: ph.value }
        })

      const chargeOpt = chargeOpts.find((o) => String(o.id) === role)
      const chargePayload: PersonPayload["charge"] =
        role && chargeLabelId && chargeOpt
          ? [{ id: chargeOpt.id, label_id: chargeLabelId, option: chargeOpt.value, value: "" }]
          : []

      const payload: PersonPayload = {
        name: name.trim(),
        organization_id: orgId,
        pais_origen: country,
        contact_source: source || null,
        internal_position: internalRole.trim() || null,
        birth_date: birthDate || null,
        linkedin_url:  socials.find((s) => s.network === "linkedin")?.value.trim()  || null,
        instagram_url: socials.find((s) => s.network === "instagram")?.value.trim() || null,
        twitter_url:   socials.find((s) => s.network === "x")?.value.trim()         || null,
        facebook_url:  socials.find((s) => s.network === "facebook")?.value.trim()  || null,
        email:  emailPayload,
        phone:  phonePayload,
        charge: chargePayload,
        tag:    [],
      }

      if (isEditMode && contactId) {
        await contactService.update(contactId, payload)
        notify.success({ title: "Contacto actualizado", description: `"${name.trim()}" fue actualizado correctamente.` })
        onSuccess?.()
      } else {
        const created = await contactService.create(payload)
        notify.success({ title: "Contacto creado", description: `"${name.trim()}" fue creado correctamente.` })
        onSuccess?.({ id: created.id, name: created.name })
      }
      handleClose()
    } catch {
      notify.error({ title: "Algo salió mal", description: `No se pudo ${isEditMode ? "actualizar" : "crear"} el contacto.` })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Si el contacto ya trae algo cargado en estos campos (modo edición), la sección
  // arranca expandida — si no, colapsada, ya que en la práctica casi nunca se usan.
  const hasAdditionalData = !!(role || internalRole || birthDate || socials.some((s) => s.value.trim()))

  return (
  <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 720, padding: 0, gap: 0 }}
        className="w-full!"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b p-5">
          <div className="space-y-0.5">
            {breadcrumb && (
              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <span>{breadcrumb}</span>
                <ChevronRightIcon className="size-3" />
                <span>Crear Contacto</span>
              </div>
            )}
            <SheetTitle>{isEditMode ? "Editar Contacto" : "Crear Nuevo Contacto"}</SheetTitle>
            <SheetDescription>
              {isEditMode ? "Modifica los datos del contacto" : "Agrega un nuevo contacto a tu CRM"}
            </SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ContactFormSkeleton />
          ) : (
          <form id="create-contact-form" onSubmit={handleSubmit} className="space-y-5 p-5">

            <Section title="Perfil General" description="Datos básicos del contacto." icon={UserRoundIcon}>
              <div className="grid grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name" className={FIELD_LABEL}>
                    Nombre Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-name"
                    placeholder="Ej. Camila Rojas"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Organización */}
                <div className="space-y-1.5">
                  <div className="flex min-w-0 items-center justify-between gap-1">
                    <Label className={FIELD_LABEL}>Organización</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-5 shrink-0 px-1.5 text-muted-foreground"
                      onClick={() => setCreateOrgOpen(true)}
                    >
                      <PlusIcon data-icon="inline-start" />
                      Crear organización
                    </Button>
                  </div>
                  <OrgAsyncSelect
                    value={orgId}
                    selectedName={orgName}
                    onChange={(org) => { setOrgId(org?.id ?? null); setOrgName(org?.name ?? null) }}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* País de Origen + Fuente de Contacto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>País de Origen</Label>
                  <SearchableSelect
                    options={COUNTRY_OPTIONS}
                    value={country}
                    onChange={setCountry}
                    placeholder="Selecciona un país"
                    searchPlaceholder="Buscar país..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Fuente de Contacto</Label>
                  <Select value={source} onValueChange={(v) => setSource(v ?? "")}>
                    <SelectTrigger className="w-full" aria-label="Fuente de contacto">
                      <SelectValue placeholder="Selecciona una opción">
                        {(v: string) => v ? (SOURCES.find((s) => s.value === v)?.label ?? v) : "Selecciona una opción"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {SOURCES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Section>

            <Section title="Canales de Comunicación" description="Cómo te comunicas con este contacto." icon={AtSignIcon}>
              {/* Correos */}
              <div className="space-y-2">
                <Label className={FIELD_LABEL}>Correo</Label>
                <div className="flex flex-col gap-2">
                  {emails.map((email) => (
                    <div key={email.id} className="flex items-center gap-2">
                      <Select
                        value={email.type}
                        onValueChange={(v) => updateEmail(email.id, { type: v ?? "" })}
                      >
                        <SelectTrigger className="w-28 shrink-0" aria-label="Tipo de correo">
                          <SelectValue placeholder="Tipo">
                            {(v: string) => emailTypeOpts.find((o) => String(o.id) === v)?.value ?? v}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {emailTypeOpts.map((o) => (
                              <SelectItem key={o.id} value={String(o.id)}>
                                {o.value}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <InputGroup className="flex-1">
                        <InputGroupAddon>
                          <AtSignIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={email.value}
                          onChange={(e) => updateEmail(email.id, { value: e.target.value })}
                        />
                      </InputGroup>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeEmail(email.id)}
                        disabled={emails.length === 1}
                        aria-label="Eliminar correo"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addEmail}>
                  <PlusIcon data-icon="inline-start" />
                  Añadir correo
                </Button>
              </div>

              {/* Teléfonos */}
              <div className="space-y-2">
                <Label className={FIELD_LABEL}>Teléfono</Label>
                <div className="flex flex-col gap-2">
                  {phones.map((phone) => (
                    <div key={phone.id} className="flex items-center gap-2">
                      <Select
                        value={phone.type}
                        onValueChange={(v) => updatePhone(phone.id, { type: v ?? "" })}
                      >
                        <SelectTrigger className="w-28 shrink-0" aria-label="Tipo de teléfono">
                          <SelectValue placeholder="Tipo">
                            {(v: string) => phoneTypeOpts.find((o) => String(o.id) === v)?.value ?? v}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {phoneTypeOpts.map((o) => (
                              <SelectItem key={o.id} value={String(o.id)}>
                                {o.value}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Select
                        value={phone.code}
                        onValueChange={(v) => updatePhone(phone.id, { code: v ?? "+56" })}
                      >
                        <SelectTrigger className="w-20 shrink-0" aria-label="Código de país">
                          <SelectValue>
                            {(v: string) => v}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {PHONE_CODES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <InputGroup className="flex-1">
                        <InputGroupAddon>
                          <PhoneIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="tel"
                          placeholder="9 1234 5678"
                          value={phone.value}
                          onChange={(e) => updatePhone(phone.id, { value: e.target.value })}
                        />
                      </InputGroup>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removePhone(phone.id)}
                        disabled={phones.length === 1}
                        aria-label="Eliminar teléfono"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addPhone}>
                  <PlusIcon data-icon="inline-start" />
                  Añadir teléfono
                </Button>
              </div>
            </Section>

            <CollapsibleSection
              title="Información Adicional"
              description="Cargo, fecha de nacimiento y redes sociales."
              icon={ListPlusIcon}
              defaultOpen={hasAdditionalData}
            >
              {/* Cargo */}
              <div className="space-y-1.5">
                <div className="flex min-w-0 items-center justify-between gap-1">
                  <Label className={FIELD_LABEL}>Cargo</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-5 shrink-0 px-1.5 text-muted-foreground"
                  >
                    <PlusIcon data-icon="inline-start" />
                    Crear cargo
                  </Button>
                </div>
                <Select value={role} onValueChange={(v) => setRole(v ?? "")}>
                  <SelectTrigger className="w-full" aria-label="Cargo">
                    <SelectValue placeholder="Selecciona un cargo">
                      {(v: string) => v ? (chargeOpts.find((o) => String(o.id) === v)?.value ?? v) : "Selecciona un cargo"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {chargeOpts.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Cargo Interno + Fecha de Nacimiento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-internal-role" className={FIELD_LABEL}>
                    Cargo Interno
                  </Label>
                  <Input
                    id="contact-internal-role"
                    placeholder="Ej. Jefe de planta A"
                    value={internalRole}
                    onChange={(e) => setInternalRole(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-birthdate" className={FIELD_LABEL}>
                    Fecha de Nacimiento
                  </Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <CakeIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="contact-birthdate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </InputGroup>
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="space-y-2">
                <Label className={FIELD_LABEL}>Redes Sociales</Label>
                <div className="flex flex-col gap-2">
                  {socials.map((social) => {
                    const SocialIcon = SOCIAL_ICONS[social.network]
                    return (
                      <div key={social.id} className="flex items-center gap-2">
                        <Select
                          value={social.network}
                          onValueChange={(v) =>
                            updateSocial(social.id, { network: v as SocialNetwork })
                          }
                        >
                          <SelectTrigger className="w-36 shrink-0" aria-label="Red social">
                            <SelectValue>
                              {(v: string) => {
                                const NIcon = SOCIAL_ICONS[v as SocialNetwork]
                                return (
                                  <span className="flex items-center gap-2">
                                    <NIcon className="size-3.5 shrink-0" style={{ color: SOCIAL_COLORS[v as SocialNetwork] }} />
                                    {SOCIAL_LABELS[v as SocialNetwork] ?? v}
                                  </span>
                                )
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {(Object.keys(SOCIAL_LABELS) as SocialNetwork[]).map((n) => {
                                const NIcon = SOCIAL_ICONS[n]
                                return (
                                  <SelectItem key={n} value={n}>
                                    <span className="flex items-center gap-2">
                                      <NIcon className="size-3.5 shrink-0" style={{ color: SOCIAL_COLORS[n] }} />
                                      {SOCIAL_LABELS[n]}
                                    </span>
                                  </SelectItem>
                                )
                              })}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <InputGroup className="flex-1">
                          <InputGroupAddon>
                            <SocialIcon className="size-4" style={{ color: SOCIAL_COLORS[social.network] }} />
                          </InputGroupAddon>
                          <InputGroupInput
                            placeholder="usuario o URL"
                            value={social.value}
                            onChange={(e) =>
                              updateSocial(social.id, { value: e.target.value })
                            }
                          />
                        </InputGroup>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeSocial(social.id)}
                          disabled={socials.length === 1}
                          aria-label="Eliminar red social"
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={addSocial}
                >
                  <PlusIcon data-icon="inline-start" />
                  Añadir red social
                </Button>
              </div>
            </CollapsibleSection>

          </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t p-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {breadcrumb ? "Anterior" : "Cancelar"}
          </Button>
          <Button type="submit" form="create-contact-form" disabled={isSubmitting || isLoading}>
            {isSubmitting && <LoaderCircleIcon className="mr-1 size-4 animate-spin" />}
            {isEditMode ? "Guardar cambios" : "Guardar contacto"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    {createOrgOpen && (
      <CreateOrganizationSheet
        open
        onOpenChange={(v) => { if (!v) setCreateOrgOpen(false) }}
        breadcrumb="Crear Contacto"
        onSuccess={(org) => {
          setOrgId(org.id)
          setOrgName(org.name)
          setCreateOrgOpen(false)
        }}
      />
    )}
  </>
  )
}
