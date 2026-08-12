"use client"

import * as React from "react"
import { getAllCountries } from "countries-and-timezones"
import {
  BuildingIcon,
  ChevronRightIcon,
  FileTextIcon,
  GlobeIcon,
  ListPlusIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { activeOptions, catalogService } from "@/services/catalog.service"
import { organizationService } from "@/services/organization.service"
import { orgNotify } from "@/lib/notify"
import type { CatalogOption } from "@/types/catalog"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
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
import { formatTaxId, TAX_ID_META, DEFAULT_TAX_ID } from "@/lib/tax-id-utils"

// ─── Country options ──────────────────────────────────────────────────────────

const CURATED_SET = new Set<string>(CURATED_COUNTRIES)

const COUNTRY_OPTIONS = Object.values(getAllCountries())
  .filter((c) => CURATED_SET.has(c.id))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ value: c.id, label: c.name, flag: c.id }))

// ─── Social networks ──────────────────────────────────────────────────────────

type SocialNetwork = "linkedin" | "instagram" | "x" | "facebook"

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  linkedin:  "LinkedIn",
  instagram: "Instagram",
  x:         "X (Twitter)",
  facebook:  "Facebook",
}

type SocialIconProps = { className?: string; style?: React.CSSProperties }

function LinkedInIcon({ className, style }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function InstagramIcon({ className, style }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function XNetworkIcon({ className, style }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

function FacebookIcon({ className, style }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

const SOCIAL_ICONS: Record<SocialNetwork, React.FC<SocialIconProps>> = {
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

interface SocialEntry {
  id: string
  network: SocialNetwork
  value: string
}

interface AddressEntry {
  id: string
  type: string   // ID de la opción del catálogo (como string para el Select)
  value: string
}

interface CreateOrganizationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: number   // undefined = crear, number = editar
  onSuccess?: (org: { id: number; name: string }) => void
  breadcrumb?: string
}

// ─── Shared label style ───────────────────────────────────────────────────────

const FIELD_LABEL = "text-xs font-medium tracking-wider text-muted-foreground"

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

function OrgFormSkeleton() {
  return (
    <div className="space-y-5 p-5">
      <SkeletonLine className="h-24 w-full rounded-xl" />
      <SkeletonLine className="h-16 w-full rounded-xl" />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateOrganizationSheet({ open, onOpenChange, organizationId, onSuccess, breadcrumb }: CreateOrganizationSheetProps) {
  const isEdit = !!organizationId

  const [name, setName]         = React.useState("")
  const [country, setCountry]   = React.useState("CL")
  const [taxId, setTaxId]       = React.useState("")
  const [industry, setIndustry] = React.useState("")
  const [website, setWebsite]   = React.useState("")
  const [socials, setSocials]   = React.useState<SocialEntry[]>([
    { id: "1", network: "linkedin", value: "" },
  ])
  const [addresses, setAddresses] = React.useState<AddressEntry[]>([
    { id: "1", type: "", value: "" },
  ])
  const [addressTypeOptions, setAddressTypeOptions] = React.useState<CatalogOption[]>([])
  const [addressLabelId, setAddressLabelId]         = React.useState<number | null>(null)
  const [isLoadingData, setIsLoadingData]           = React.useState(false)
  const [isSubmitting, setIsSubmitting]             = React.useState(false)

  React.useEffect(() => {
    catalogService.getLabelOptions("address").then((labels) => {
      const label = labels.find((l) => l.key === "address")
      if (!label) return
      setAddressLabelId(label.id)
      const opts = activeOptions(label)
      setAddressTypeOptions(opts)
      if (opts.length > 0 && !isEdit) {
        setAddresses((prev) =>
          prev.map((a, i) => (i === 0 && a.type === "" ? { ...a, type: String(opts[0].id) } : a))
        )
      }
    }).catch(() => {})
  }, [isEdit])

  // En modo edición: cargar datos de la organización para pre-rellenar
  React.useEffect(() => {
    if (!organizationId) return
    setIsLoadingData(true)
    organizationService.getById(organizationId).then((org) => {
      setName(org.name)
      setCountry(org.pais_origen ?? "CL")
      setTaxId(org.document_number ?? "")
      setIndustry(org.industry ?? "")
      setWebsite(org.web_page ?? "")

      const loadedSocials: SocialEntry[] = []
      if (org.linkedin_url)  loadedSocials.push({ id: "1", network: "linkedin",  value: org.linkedin_url })
      if (org.instagram_url) loadedSocials.push({ id: "2", network: "instagram", value: org.instagram_url })
      if (org.twitter_url)   loadedSocials.push({ id: "3", network: "x",         value: org.twitter_url })
      if (org.facebook_url)  loadedSocials.push({ id: "4", network: "facebook",  value: org.facebook_url })
      setSocials(loadedSocials.length > 0 ? loadedSocials : [{ id: "1", network: "linkedin", value: "" }])

      const addressDetails = org.organization_detail.filter((d) => d.label?.key === "address")
      setAddresses(
        addressDetails.length > 0
          ? addressDetails.map((d) => ({
              id: String(d.id),
              type: String(d.option_id ?? ""),
              value: d.value,
            }))
          : [{ id: "1", type: "", value: "" }]
      )
    }).catch(() => {
      orgNotify.error("No se pudo cargar la organización")
    }).finally(() => {
      setIsLoadingData(false)
    })
  }, [organizationId])

  const taxIdMeta = TAX_ID_META[country] ?? DEFAULT_TAX_ID

  function addSocial() {
    setSocials((prev) => [
      ...prev,
      { id: crypto.randomUUID(), network: "linkedin", value: "" },
    ])
  }

  function removeSocial(id: string) {
    setSocials((prev) => prev.filter((s) => s.id !== id))
  }

  function updateSocial(id: string, patch: Partial<SocialEntry>) {
    setSocials((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addAddress() {
    const defaultType = addressTypeOptions[0] ? String(addressTypeOptions[0].id) : ""
    setAddresses((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: defaultType, value: "" },
    ])
  }

  function removeAddress(id: string) {
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  function updateAddress(id: string, patch: Partial<AddressEntry>) {
    setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  function handleClose() {
    onOpenChange(false)
    setName("")
    setCountry("CL")
    setTaxId("")
    setIndustry("")
    setWebsite("")
    setSocials([{ id: "1", network: "linkedin", value: "" }])
    const defaultType = addressTypeOptions[0] ? String(addressTypeOptions[0].id) : ""
    setAddresses([{ id: "1", type: defaultType, value: "" }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      orgNotify.error("El nombre es obligatorio")
      return
    }
    const socialMap = Object.fromEntries(socials.map((s) => [s.network, s.value || null]))
    const payload = {
      name: name.trim(),
      pais_origen: country,
      document_number: taxId || null,
      web_page: normalizeUrl(website),
      industry: industry || null,
      linkedin_url:  socialMap["linkedin"]  ?? null,
      instagram_url: socialMap["instagram"] ?? null,
      twitter_url:   socialMap["x"]         ?? null,
      facebook_url:  socialMap["facebook"]  ?? null,
      address: addresses
        .filter((a) => a.value.trim())
        .map((a) => {
          const opt = addressTypeOptions.find((o) => String(o.id) === a.type)
          return { label_id: addressLabelId, id: opt?.id ?? null, option: opt?.value ?? "", value: a.value }
        }),
      tag: [],
    }
    setIsSubmitting(true)
    try {
      if (isEdit && organizationId) {
        await organizationService.update(organizationId, payload)
        orgNotify.updated(name.trim())
        onSuccess?.({ id: organizationId, name: name.trim() })
      } else {
        const org = await organizationService.create(payload)
        orgNotify.created(org.name)
        onSuccess?.({ id: org.id, name: org.name })
      }
      handleClose()
    } catch {
      orgNotify.error(isEdit ? "No se pudo actualizar la organización." : "No se pudo crear la organización.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Si la organización ya trae algo cargado acá (modo edición), la sección arranca
  // expandida — si no, colapsada, ya que en la práctica casi nunca se usan.
  const hasAdditionalData = !!(industry || website || socials.some((s) => s.value.trim()))

  return (
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
                <span>{isEdit ? "Editar Organización" : "Crear Organización"}</span>
              </div>
            )}
            <SheetTitle>{isEdit ? "Editar Organización" : "Crear Nueva Organización"}</SheetTitle>
            <SheetDescription>
              {isEdit ? "Modifica los datos de la organización" : "Registra una nueva organización en tu CRM"}
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
          {isLoadingData ? (
            <OrgFormSkeleton />
          ) : (
          <form id="create-org-form" onSubmit={handleSubmit} className="space-y-5 p-5">

            <Section title="Perfil General" description="Datos básicos de la organización." icon={BuildingIcon}>
              {/* Nombre */}
              <div className="space-y-1.5">
                <Label htmlFor="org-name" className={FIELD_LABEL}>
                  Nombre de la Organización{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="org-name"
                  placeholder="Ej. Cornershop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* País + ID Fiscal */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>País de Origen</Label>
                  <SearchableSelect
                    options={COUNTRY_OPTIONS}
                    value={country}
                    onChange={(val) => {
                      setCountry(val)
                      setTaxId("")
                    }}
                    placeholder="Selecciona un país"
                    searchPlaceholder="Buscar país..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org-taxid" className={FIELD_LABEL}>
                    {taxIdMeta.label}
                  </Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <FileTextIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="org-taxid"
                      placeholder={taxIdMeta.placeholder}
                      value={taxId}
                      onChange={(e) => setTaxId(formatTaxId(country, e.target.value))}
                    />
                  </InputGroup>
                </div>
              </div>

              {/* Direcciones */}
              <div className="space-y-2">
                <Label className={FIELD_LABEL}>Direcciones</Label>
                <div className="flex flex-col gap-2">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="flex items-center gap-2">
                      <Select
                        value={addr.type}
                        onValueChange={(v) => updateAddress(addr.id, { type: v ?? "" })}
                      >
                        <SelectTrigger className="w-44 shrink-0" aria-label="Tipo de dirección">
                          <SelectValue>
                            {(v: string) => addressTypeOptions.find((o) => String(o.id) === v)?.value ?? v}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {addressTypeOptions.map((opt) => (
                              <SelectItem key={opt.id} value={String(opt.id)}>
                                {opt.value}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>

                      <AddressAutocomplete
                        className="flex-1"
                        value={addr.value}
                        onChange={(v) => updateAddress(addr.id, { value: v })}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeAddress(addr.id)}
                        disabled={addresses.length === 1}
                        aria-label="Eliminar dirección"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={addAddress}
                >
                  <PlusIcon data-icon="inline-start" />
                  Añadir dirección
                </Button>
              </div>
            </Section>

            <CollapsibleSection
              title="Información Adicional"
              description="Industria, página web y redes sociales."
              icon={ListPlusIcon}
              defaultOpen={hasAdditionalData}
            >
              {/* Industria */}
              <div className="space-y-1.5">
                <Label htmlFor="org-industry" className={FIELD_LABEL}>Industria</Label>
                <Input
                  id="org-industry"
                  placeholder="Ej. Tecnología de la Información"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>

              {/* Página Web */}
              <div className="space-y-1.5">
                <Label htmlFor="org-website" className={FIELD_LABEL}>
                  Página Web
                </Label>
                <InputGroup>
                  <InputGroupAddon>
                    <GlobeIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="org-website"
                    placeholder="goxt.io, www.goxt.io, https://goxt.io"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </InputGroup>
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
                            placeholder="usuario o URL completa"
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
          <Button type="submit" form="create-org-form" disabled={isSubmitting || isLoadingData}>
            {isSubmitting && <LoaderCircleIcon className="mr-1.5 size-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Guardar organización"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
