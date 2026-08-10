"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { getAllCountries, getCountry } from "countries-and-timezones"
import { Loader2Icon, PencilIcon, UploadIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/notify"
import { workspaceService } from "@/services/workspace.service"
import { currencyService } from "@/services/currency.service"
import { useSessionStore } from "@/store/session.store"
import { CURATED_COUNTRIES } from "@/lib/curated-countries"
import { CURRENCY_FLAG } from "@/lib/currency-utils"
import { formatTaxId, TAX_ID_META, DEFAULT_TAX_ID } from "@/lib/tax-id-utils"
import { PHONE_CODES, COUNTRY_DIAL_CODE, splitPhone } from "@/lib/phone-utils"
import type { Workspace } from "@/types/workspace"
import type { CurrencyRaw } from "@/types/currency"

const CURATED_SET = new Set<string>(CURATED_COUNTRIES)

const ALL_COUNTRIES = Object.values(getAllCountries())
  .filter((c) => CURATED_SET.has(c.id))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ value: c.id, label: c.name, flag: c.id }))

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const identitySchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  country: z.string().min(1, "Selecciona un país"),
  timezone: z.string().min(1, "Selecciona una zona horaria"),
  currency: z.string().min(1, "Selecciona una moneda"),
})

const legalSchema = z.object({
  legalName: z.string().optional(),
  fantasyName: z.string().optional(),
  nationalId: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  website: z.string().optional(),
  fiscalAddress: z.string().optional(),
})

const aiSchema = z.object({
  objective: z.string().optional(),
  description: z.string().optional(),
})

type IdentityValues = z.infer<typeof identitySchema>
type LegalValues = z.infer<typeof legalSchema>
type AiValues = z.infer<typeof aiSchema>

export function WorkspaceForm() {
  const user = useSessionStore((s) => s.user)
  const workspaceId = useSessionStore((s) => s.workspaceId)
  const isAdmin = !!user?.user_workspace?.find((uw) => uw.workspace_id === workspaceId && (uw.is_admin || uw.is_owner))

  const [isLoading, setIsLoading] = useState(true)
  const [timezones, setTimezones] = useState<{ value: string; label: string }[]>([])
  const [currencies, setCurrencies] = useState<CurrencyRaw[]>([])
  const [logo, setLogo] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [phoneCode, setPhoneCode] = useState("+56")

  const [editingIdentity, setEditingIdentity] = useState(false)
  const [editingLegal, setEditingLegal] = useState(false)
  const [editingAi, setEditingAi] = useState(false)
  const [savingIdentity, setSavingIdentity] = useState(false)
  const [savingLegal, setSavingLegal] = useState(false)
  const [savingAi, setSavingAi] = useState(false)

  const currencyOptions = currencies.map((c) => ({ value: String(c.id), label: c.code, flag: CURRENCY_FLAG[c.code] }))

  const identityForm = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: { name: "", country: "", timezone: "", currency: "" },
  })

  const selectedCountry = identityForm.watch("country")
  const taxIdMeta = TAX_ID_META[selectedCountry] ?? DEFAULT_TAX_ID

  useEffect(() => {
    if (!selectedCountry) { setTimezones([]); return }
    const country = getCountry(selectedCountry)
    const tzList = (country?.timezones ?? []).map((tz) => ({ value: tz, label: tz }))
    setTimezones(tzList)
  }, [selectedCountry])

  const legalForm = useForm<LegalValues>({
    resolver: zodResolver(legalSchema),
    defaultValues: {
      legalName: "",
      fantasyName: "",
      nationalId: "",
      industry: "",
      phone: "",
      email: "",
      website: "",
      fiscalAddress: "",
    },
  })

  const aiForm = useForm<AiValues>({
    resolver: zodResolver(aiSchema),
    defaultValues: { objective: "", description: "" },
  })

  function applyWorkspace(ws: Workspace) {
    // Si no hay una moneda marcada como principal, usamos la primera disponible
    // en vez de dejar el campo vacío (rompería el guardado, la moneda es obligatoria).
    const mainCurrencyId = (ws.workspace_currency?.find((c) => c.is_main) ?? ws.workspace_currency?.[0])?.currency_id
    const { code, number } = splitPhone(ws.company_phone, COUNTRY_DIAL_CODE[ws.country_id] ?? "+56")
    setLogo(ws.logo ?? null)
    setPhoneCode(code)
    identityForm.reset({
      name: ws.name ?? "",
      country: ws.country_id ?? "",
      timezone: ws.timezone ?? "",
      currency: mainCurrencyId ? String(mainCurrencyId) : "",
    })
    legalForm.reset({
      legalName: ws.legal_name ?? "",
      fantasyName: ws.trade_name ?? "",
      nationalId: ws.tax_id ?? "",
      industry: ws.industry ?? "",
      phone: number,
      email: ws.company_email ?? "",
      website: ws.company_website ?? "",
      fiscalAddress: ws.company_address ?? "",
    })
    aiForm.reset({
      objective: ws.objective ?? "",
      description: ws.business_description ?? "",
    })
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setUploadingLogo(true)
    try {
      const base64 = await fileToBase64(file)
      const logoUrl = await workspaceService.uploadLogo(file.name, base64)
      setLogo(logoUrl)
      // uploadLogo ya persiste en el backend — pero el sidebar (TeamSwitcher)
      // lee el logo desde el session store, no desde este form. Sin refrescar
      // la sesión acá, se queda con el logo viejo hasta recargar la página.
      await useSessionStore.getState().hydrate()
      notify.success({ title: "Logo actualizado", description: "Ya se guardó correctamente." })
    } catch {
      notify.error({ title: "No se pudo subir el logo", description: "Intenta de nuevo." })
    } finally {
      setUploadingLogo(false)
    }
  }

  useEffect(() => {
    Promise.all([workspaceService.get(), currencyService.list()])
      .then(([ws, currencyList]) => {
        setCurrencies(currencyList)
        applyWorkspace(ws)
      })
      .finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveWorkspace() {
    const identity = identityForm.getValues()
    const legal = legalForm.getValues()
    const ai = aiForm.getValues()
    const countryName = ALL_COUNTRIES.find((c) => c.value === identity.country)?.label ?? identity.country
    const currency = currencies.find((c) => String(c.id) === identity.currency)

    if (!identity.country || !identity.timezone || !currency) {
      throw new Error("Falta completar país, zona horaria o moneda en Identidad del Workspace antes de guardar.")
    }

    const updated = await workspaceService.update({
      name: identity.name,
      country: { id: identity.country, name: countryName },
      timezone: { id: identity.timezone, name: identity.timezone },
      // El backend solo exige que "name" no venga vacío — usamos el code (CLP, USD...)
      // igual que el resto de la app (CreateOpportunitySheet), porque el campo `name`
      // real de la tabla currency viene vacío para varias monedas en esta base de datos.
      currency: { id: currency?.id ?? 0, name: currency?.code || currency?.name || "" },
      logo: logo ?? "",
      legal_name: legal.legalName ?? "",
      trade_name: legal.fantasyName ?? "",
      tax_id: legal.nationalId ?? "",
      industry: legal.industry ?? "",
      company_address: legal.fiscalAddress ?? "",
      company_phone: legal.phone ? `${phoneCode} ${legal.phone}`.trim() : "",
      company_email: legal.email ?? "",
      company_website: legal.website ?? "",
      objective: ai.objective ?? "",
      business_description: ai.description ?? "",
    })
    // El endpoint de update no devuelve las relaciones completas (workspace_currency) —
    // volvemos a pedir el workspace fresco para mantener los 3 forms 100% consistentes.
    const fresh = await workspaceService.get()
    applyWorkspace(fresh)
    // Refresca el session store (sidebar/TeamSwitcher) — sin esto, un cambio
    // de nombre/logo acá se queda pegado en la sesión vieja hasta recargar.
    // Comparte este helper Identidad/Legal/IA, así que cubre los 3 forms.
    await useSessionStore.getState().hydrate()
    return updated
  }

  function errorDescription(error: unknown): string {
    return error instanceof Error && error.message.startsWith("Falta completar")
      ? error.message
      : "No se pudo actualizar el workspace."
  }

  async function onIdentitySubmit(values: IdentityValues) {
    setSavingIdentity(true)
    try {
      await saveWorkspace()
      setEditingIdentity(false)
      notify.success({ title: "Workspace actualizado", description: "Los datos de identidad se guardaron correctamente." })
    } catch (error) {
      notify.error({ title: "Algo salió mal", description: errorDescription(error) })
    } finally {
      setSavingIdentity(false)
    }
  }

  async function onLegalSubmit() {
    setSavingLegal(true)
    try {
      await saveWorkspace()
      setEditingLegal(false)
      notify.success({ title: "Workspace actualizado", description: "La información empresarial se guardó correctamente." })
    } catch (error) {
      notify.error({ title: "Algo salió mal", description: errorDescription(error) })
    } finally {
      setSavingLegal(false)
    }
  }

  async function onAiSubmit() {
    setSavingAi(true)
    try {
      await saveWorkspace()
      setEditingAi(false)
      notify.success({ title: "Workspace actualizado", description: "El contexto del agente IA se guardó correctamente." })
    } catch (error) {
      notify.error({ title: "Algo salió mal", description: errorDescription(error) })
    } finally {
      setSavingAi(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="border-b">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Identidad */}
      <form onSubmit={identityForm.handleSubmit(onIdentitySubmit)}>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Identidad del Workspace</CardTitle>
            <CardDescription>Logo, nombre y configuración regional</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-xl border bg-muted overflow-hidden">
                <img
                  src={logo || "/images/goxt-negro.png"}
                  alt="Logo del workspace"
                  className={logo ? "size-full object-contain p-2" : "size-10 object-contain"}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit gap-2"
                  disabled={!editingIdentity || uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploadingLogo ? <Loader2Icon className="size-3.5 animate-spin" /> : <UploadIcon className="size-3.5" />}
                  {uploadingLogo ? "Subiendo..." : "Cambiar Logo"}
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB.</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="ws-name"
                className={identityForm.formState.errors.name ? "text-destructive" : ""}
              >
                Nombre del Workspace
              </Label>
              <Input
                id="ws-name"
                disabled={!editingIdentity}
                {...identityForm.register("name")}
                className={identityForm.formState.errors.name ? "border-destructive" : ""}
              />
              {identityForm.formState.errors.name && (
                <p className="text-[0.8rem] text-destructive">
                  {identityForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className={identityForm.formState.errors.country ? "text-destructive" : ""}>
                  País de Operación
                </Label>
                <Controller
                  control={identityForm.control}
                  name="country"
                  render={({ field }) => (
                    <SearchableSelect
                      options={ALL_COUNTRIES}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        identityForm.setValue("timezone", "")
                      }}
                      placeholder="Selecciona un país"
                      searchPlaceholder="Buscar país..."
                      hasError={!!identityForm.formState.errors.country}
                      disabled={!editingIdentity}
                    />
                  )}
                />
                {identityForm.formState.errors.country && (
                  <p className="text-[0.8rem] text-destructive">
                    {identityForm.formState.errors.country.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className={identityForm.formState.errors.timezone ? "text-destructive" : ""}>
                  Zona Horaria
                </Label>
                <Controller
                  control={identityForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <SearchableSelect
                      options={timezones}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecciona una zona horaria"
                      disabled={!editingIdentity || timezones.length === 0}
                      hasError={!!identityForm.formState.errors.timezone}
                    />
                  )}
                />
                {identityForm.formState.errors.timezone && (
                  <p className="text-[0.8rem] text-destructive">
                    {identityForm.formState.errors.timezone.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className={identityForm.formState.errors.currency ? "text-destructive" : ""}>
                  Moneda
                </Label>
                <Controller
                  control={identityForm.control}
                  name="currency"
                  render={({ field }) => (
                    <SearchableSelect
                      options={currencyOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecciona una moneda"
                      hasError={!!identityForm.formState.errors.currency}
                      disabled={!editingIdentity}
                    />
                  )}
                />
                {identityForm.formState.errors.currency && (
                  <p className="text-[0.8rem] text-destructive">
                    {identityForm.formState.errors.currency.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {editingIdentity ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingIdentity}
                  onClick={() => { identityForm.reset(); setEditingIdentity(false) }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingIdentity}>
                  {savingIdentity && <Loader2Icon className="size-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </>
            ) : isAdmin && (
              <Button type="button" variant="outline" className="gap-1.5" onClick={() => setEditingIdentity(true)}>
                <PencilIcon className="size-3.5" /> Editar
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>

      {/* Información Empresarial */}
      <form onSubmit={legalForm.handleSubmit(onLegalSubmit)}>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Información Empresarial</CardTitle>
            <CardDescription>Datos legales y de contacto</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="legalName">Razón Social</Label>
                <Input id="legalName" disabled={!editingLegal} {...legalForm.register("legalName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fantasyName">Nombre Fantasía</Label>
                <Input id="fantasyName" disabled={!editingLegal} {...legalForm.register("fantasyName")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nationalId">{taxIdMeta.label}</Label>
                <Controller
                  control={legalForm.control}
                  name="nationalId"
                  render={({ field }) => (
                    <Input
                      id="nationalId"
                      disabled={!editingLegal}
                      placeholder={taxIdMeta.placeholder}
                      value={field.value}
                      onChange={(e) => field.onChange(formatTaxId(selectedCountry, e.target.value))}
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Giro / Industria</Label>
                <Input id="industry" disabled={!editingLegal} {...legalForm.register("industry")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ws-phone">Teléfono</Label>
                <div className="flex items-center gap-2">
                  <Select value={phoneCode} onValueChange={(v) => setPhoneCode(v ?? "+56")} disabled={!editingLegal}>
                    <SelectTrigger className="w-24 shrink-0" aria-label="Código de país">
                      <SelectValue>{(v: string) => v}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {PHONE_CODES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Controller
                    control={legalForm.control}
                    name="phone"
                    render={({ field }) => (
                      <Input
                        id="ws-phone"
                        type="tel"
                        disabled={!editingLegal}
                        placeholder="9 1234 5678"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="ws-email"
                  className={legalForm.formState.errors.email ? "text-destructive" : ""}
                >
                  Email
                </Label>
                <Input
                  id="ws-email"
                  type="email"
                  disabled={!editingLegal}
                  {...legalForm.register("email")}
                  className={legalForm.formState.errors.email ? "border-destructive" : ""}
                />
                {legalForm.formState.errors.email && (
                  <p className="text-[0.8rem] text-destructive">
                    {legalForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website">Sitio Web</Label>
              <Input id="website" disabled={!editingLegal} {...legalForm.register("website")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fiscalAddress">Dirección Fiscal</Label>
              <Textarea
                id="fiscalAddress"
                rows={3}
                disabled={!editingLegal}
                {...legalForm.register("fiscalAddress")}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {editingLegal ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingLegal}
                  onClick={() => { legalForm.reset(); setEditingLegal(false) }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingLegal}>
                  {savingLegal && <Loader2Icon className="size-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </>
            ) : isAdmin && (
              <Button type="button" variant="outline" className="gap-1.5" onClick={() => setEditingLegal(true)}>
                <PencilIcon className="size-3.5" /> Editar
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>

      {/* Contexto IA */}
      <form onSubmit={aiForm.handleSubmit(onAiSubmit)}>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Contexto del Agente IA</CardTitle>
            <CardDescription>El agente usa esta información para entender tu negocio</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="objective">Objetivo del negocio</Label>
                <Textarea
                  id="objective"
                  rows={4}
                  disabled={!editingAi}
                  placeholder="Ej: Aumentar ventas en el segmento de transporte de carga, fidelizar clientes actuales y expandir a nuevas regiones."
                  {...aiForm.register("objective")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Descripción del negocio</Label>
                <Textarea
                  id="description"
                  rows={4}
                  disabled={!editingAi}
                  placeholder="Ej: Empresa de logística especializada en transporte de carga pesada a nivel nacional, con más de 10 años de experiencia."
                  {...aiForm.register("description")}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {editingAi ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingAi}
                  onClick={() => { aiForm.reset(); setEditingAi(false) }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingAi}>
                  {savingAi && <Loader2Icon className="size-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </>
            ) : isAdmin && (
              <Button type="button" variant="outline" className="gap-1.5" onClick={() => setEditingAi(true)}>
                <PencilIcon className="size-3.5" /> Editar
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
