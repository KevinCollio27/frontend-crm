"use client"

import * as React from "react"
import { ClipboardListIcon, EyeIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Flow } from "@/types/flow"
import type { ClassicBaseConfig, PublicCustomField } from "@/types/public-form"
import { ClassicRenderer } from "@/app/(public)/widget/form/[slug]/_components/ClassicRenderer"
import { buildBaseConfig, FONT_LABEL, type FormFormState } from "../shared/form-state"

interface Step4ReviewProps {
  form: FormFormState
  flows: Flow[]
}

export function Step4Review({ form, flows }: Step4ReviewProps) {
  const flowName = flows.find((f) => String(f.id) === form.flowId)?.name ?? "—"

  const contactFields = Object.values(form.contact.fields).filter((f) => f.enabled)
  const organizationFields = form.organization.enabled
    ? Object.values(form.organization.fields).filter((f) => f.enabled)
    : []
  const opportunityFields = Object.values(form.opportunity.fields).filter((f) => f.enabled)
  const baseFieldsCount = contactFields.length + organizationFields.length + opportunityFields.length

  const previewConfig = React.useMemo(() => buildBaseConfig(form) as unknown as ClassicBaseConfig, [form])

  return (
    <div className="mx-auto max-w-3xl">
      <Tabs defaultValue="preview">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resumen">
            <ClipboardListIcon className="size-3.5" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="preview">
            <EyeIcon className="size-3.5" /> Vista previa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewRow label="Nombre" value={form.name || "—"} />
            <ReviewRow label="URL pública" value={<span className="font-mono">/form/{form.slug || "—"}</span>} />
            <ReviewRow label="Embudo destino" value={flowName} />
            <ReviewRow
              label="Estado"
              value={<Badge variant="outline">{form.isActive ? "Activo" : "Inactivo"}</Badge>}
            />
            <ReviewRow
              label="Marca"
              value={
                <div className="flex items-center gap-2">
                  <span className="size-4 rounded" style={{ backgroundColor: form.design.primary }} />
                  {FONT_LABEL[form.design.font]}
                </div>
              }
            />
            <ReviewRow
              label="Organización"
              value={form.organization.enabled ? "Solicitada" : "No se pide"}
            />
          </div>

          <ReviewRow
            label={`Campos base (${baseFieldsCount})`}
            value={
              baseFieldsCount > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {[...contactFields, ...organizationFields, ...opportunityFields].map((f, i) => (
                    <Badge key={i} variant="secondary">
                      {f.label}
                      {f.required && " *"}
                    </Badge>
                  ))}
                </div>
              ) : (
                "Sin campos activados"
              )
            }
          />

          <ReviewRow
            label={`Campos adicionales (${form.customFields.length})`}
            value={
              form.customFields.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {form.customFields.map((f) => (
                    <Badge key={f.id} variant="secondary">
                      {f.label || f.type}
                      {f.required && " *"}
                    </Badge>
                  ))}
                </div>
              ) : (
                "Sin campos extra"
              )
            }
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Así se ve el formulario público para quien lo responda. No envía datos de verdad.
          </p>
          <div className="overflow-hidden rounded-2xl border">
            <ClassicRenderer
              slug={form.slug || "vista-previa"}
              name={form.name || "Formulario"}
              description={form.description}
              config={previewConfig}
              customFields={form.customFields as unknown as PublicCustomField[]}
              preview
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  )
}
