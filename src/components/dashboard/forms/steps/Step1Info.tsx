"use client"

import * as React from "react"
import {
  AlignLeftIcon,
  AlignRightIcon,
  Columns2Icon,
  ImageIcon,
  PaletteIcon,
  RectangleHorizontalIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/ui/field"
import { Section } from "@/components/ui/section"
import { CollapsibleSection } from "@/components/ui/collapsible-section"
import { ImageUpload } from "@/components/ui/image-upload"
import { cn } from "@/lib/utils"
import type { Flow } from "@/types/flow"
import {
  FONT_LABEL,
  toSlug,
  type FormDensity,
  type FormFont,
  type FormFormState,
  type FormLayout,
} from "../shared/form-state"

const DENSITY_LABEL: Record<FormDensity, string> = {
  compact: "Compacta",
  comfortable: "Cómoda",
  spacious: "Espaciada",
}

interface Step1InfoProps {
  form: FormFormState
  setForm: React.Dispatch<React.SetStateAction<FormFormState>>
  flows: Flow[]
  isEdit?: boolean
}

export function Step1Info({ form, setForm, flows, isEdit }: Step1InfoProps) {
  const slugManualRef = React.useRef(isEdit || form.slug !== "")

  function handleNameChange(name: string) {
    setForm((f) => {
      const next: FormFormState = { ...f, name }
      if (!slugManualRef.current) next.slug = toSlug(name)
      return next
    })
  }

  function handleSlugChange(slug: string) {
    slugManualRef.current = true
    setForm((f) => ({ ...f, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
  }

  function patchDesign(p: Partial<FormFormState["design"]>) {
    setForm((f) => ({ ...f, design: { ...f.design, ...p } }))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Section title="Información General" description="Identifica tu formulario.">
        <Field label="Nombre del Formulario" required>
          <Input
            placeholder="Ej: Formulario de contacto para landing"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </Field>

        <Field label="Slug (URL pública)" required description="Solo letras minúsculas, números y guiones.">
          <div className="flex items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
            <span className="shrink-0 pr-1">/form/</span>
            <input
              className="flex-1 bg-transparent py-2 font-mono text-foreground outline-none placeholder:text-muted-foreground/60"
              placeholder="mi-formulario"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
            />
          </div>
        </Field>

        <Field label="Descripción Interna">
          <Textarea
            placeholder="Para qué sirve, dónde se publicará, etc."
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Embudo Destino" required description="Los leads del formulario se crearán en este embudo.">
            <Select
              value={form.flowId}
              onValueChange={(v) => setForm((f) => ({ ...f, flowId: v ?? "" }))}
            >
              <SelectTrigger className="w-full" aria-label="Embudo destino">
                <SelectValue placeholder="Selecciona un embudo">
                  {(v: string) => flows.find((flow) => String(flow.id) === v)?.name ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {flows.map((flow) => (
                    <SelectItem key={flow.id} value={String(flow.id)}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Estado">
            <div className="flex h-9 items-center justify-between rounded-md border px-3">
              <span className="text-sm">{form.isActive ? "Activo" : "Inactivo"}</span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
          </Field>
        </div>
      </Section>

      <CollapsibleSection title="Marca" description="Color, tipografía y estilo del formulario." icon={PaletteIcon}>
        <Field label="Color primario">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.design.primary}
              onChange={(e) => patchDesign({ primary: e.target.value })}
              className="size-9 shrink-0 rounded border"
            />
            <Input value={form.design.primary} onChange={(e) => patchDesign({ primary: e.target.value })} />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipografía">
            <Select value={form.design.font} onValueChange={(v) => patchDesign({ font: (v ?? "inter") as FormFont })}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => FONT_LABEL[v as FormFont] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.keys(FONT_LABEL) as FormFont[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {FONT_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Densidad">
            <Select
              value={form.design.density}
              onValueChange={(v) => patchDesign({ density: (v ?? "comfortable") as FormDensity })}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => DENSITY_LABEL[v as FormDensity] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.keys(DENSITY_LABEL) as FormDensity[]).map((den) => (
                    <SelectItem key={den} value={den}>
                      {DENSITY_LABEL[den]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Radio de bordes (px)">
          <Input
            type="number"
            min={0}
            max={100}
            value={form.design.radius}
            onChange={(e) => patchDesign({ radius: Math.min(100, Math.max(0, Number(e.target.value))) })}
            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="Portada" description="Título, imagen y layout del formulario público." icon={ImageIcon}>
        <Field label="Título público" description="Si lo dejas vacío se usa el nombre del formulario.">
          <Input
            placeholder="Ej: Cuéntanos sobre tu proyecto"
            value={form.design.coverTitle}
            onChange={(e) => patchDesign({ coverTitle: e.target.value })}
          />
        </Field>
        <Field label="Subtítulo">
          <Input
            placeholder="Ej: Te responderemos en menos de 24 horas"
            value={form.design.coverSubtitle}
            onChange={(e) => patchDesign({ coverSubtitle: e.target.value })}
          />
        </Field>
        <Field label="Imagen de portada">
          <ImageUpload
            value={form.design.coverImage}
            onChange={(url, key) => patchDesign({ coverImage: url, coverImageKey: key ?? "" })}
          />
        </Field>

        <Field label="Layout">
          <div className="flex gap-2">
            {(
              [
                { value: "1col" as FormLayout, label: "1 columna", icon: RectangleHorizontalIcon },
                { value: "2col" as FormLayout, label: "2 columnas", icon: Columns2Icon },
              ]
            ).map((opt) => {
              const Icon = opt.icon
              const active = form.design.layout === opt.value
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className={cn("flex-1", active && "ring-2 ring-primary/20")}
                  onClick={() => patchDesign({ layout: opt.value })}
                >
                  <Icon className="size-4" />
                  {opt.label}
                </Button>
              )
            })}
          </div>
        </Field>

        {form.design.layout === "2col" && (
          <Field label="Posición de la imagen">
            <div className="flex gap-2">
              {(
                [
                  { value: "left" as const, label: "Izquierda", icon: AlignLeftIcon },
                  { value: "right" as const, label: "Derecha", icon: AlignRightIcon },
                ]
              ).map((opt) => {
                const Icon = opt.icon
                const active = form.design.imageSide === opt.value
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={active ? "default" : "outline"}
                    className={cn("flex-1", active && "ring-2 ring-primary/20")}
                    onClick={() => patchDesign({ imageSide: opt.value })}
                  >
                    <Icon className="size-4" />
                    {opt.label}
                  </Button>
                )
              })}
            </div>
          </Field>
        )}

        <Field label="Texto del botón de envío">
          <Input value={form.design.buttonLabel} onChange={(e) => patchDesign({ buttonLabel: e.target.value })} />
        </Field>
      </CollapsibleSection>
    </div>
  )
}
