"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { getAllCountries, getCountry } from "countries-and-timezones"
import { UploadIcon } from "lucide-react"
import { useEffect, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"

const ALL_COUNTRIES = Object.values(getAllCountries())
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ value: c.id, label: c.name, flag: c.id }))

const CURRENCIES = [
  { value: "USD", label: "USD — Dólar estadounidense", flag: "us" },
  { value: "EUR", label: "EUR — Euro", flag: "eu" },
  { value: "CLP", label: "CLP — Peso chileno", flag: "cl" },
  { value: "ARS", label: "ARS — Peso argentino", flag: "ar" },
  { value: "COP", label: "COP — Peso colombiano", flag: "co" },
  { value: "MXN", label: "MXN — Peso mexicano", flag: "mx" },
  { value: "PEN", label: "PEN — Sol peruano", flag: "pe" },
  { value: "BRL", label: "BRL — Real brasileño", flag: "br" },
]

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

const currentWorkspace = {
  name: "Guett",
  country: "CL",
  timezone: "America/Santiago",
  currency: "CLP",
}

export function WorkspaceForm() {
  const [timezones, setTimezones] = useState<{ value: string; label: string }[]>([])

  const identityForm = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      name: currentWorkspace.name,
      country: currentWorkspace.country,
      timezone: currentWorkspace.timezone,
      currency: currentWorkspace.currency,
    },
  })

  const selectedCountry = identityForm.watch("country")

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

  function onIdentitySubmit(values: IdentityValues) {
    console.log("identity:", values)
  }

  function onLegalSubmit(values: LegalValues) {
    console.log("legal:", values)
  }

  function onAiSubmit(values: AiValues) {
    console.log("ai:", values)
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
                  src="/images/goxt-negro.png"
                  alt="Logo del workspace"
                  className="size-10 object-contain"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Button type="button" variant="outline" size="sm" className="w-fit gap-2">
                  <UploadIcon className="size-3.5" />
                  Cambiar Logo
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG. Máx. 5MB</p>
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
                      disabled={timezones.length === 0}
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
                      options={CURRENCIES}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecciona una moneda"
                      hasError={!!identityForm.formState.errors.currency}
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
            <Button type="button" variant="outline" onClick={() => identityForm.reset()}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
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
                <Input id="legalName" {...legalForm.register("legalName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fantasyName">Nombre Fantasía</Label>
                <Input id="fantasyName" {...legalForm.register("fantasyName")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nationalId">Identificador Nacional</Label>
                <Input id="nationalId" {...legalForm.register("nationalId")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Giro / Industria</Label>
                <Input id="industry" {...legalForm.register("industry")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ws-phone">Teléfono</Label>
                <Input id="ws-phone" {...legalForm.register("phone")} />
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
              <Input id="website" {...legalForm.register("website")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fiscalAddress">Dirección Fiscal</Label>
              <Textarea
                id="fiscalAddress"
                rows={3}
                {...legalForm.register("fiscalAddress")}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => legalForm.reset()}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
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
                  placeholder="Ej: Aumentar ventas en el segmento de transporte de carga, fidelizar clientes actuales y expandir a nuevas regiones."
                  {...aiForm.register("objective")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Descripción del negocio</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Ej: Empresa de logística especializada en transporte de carga pesada a nivel nacional, con más de 10 años de experiencia."
                  {...aiForm.register("description")}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => aiForm.reset()}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
