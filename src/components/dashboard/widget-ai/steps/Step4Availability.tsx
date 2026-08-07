import * as React from "react"
import { CheckIcon } from "lucide-react"

import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { WidgetFormState, WidgetPosition } from "../shared/form-state"

const POSITIONS: { value: WidgetPosition; label: string }[] = [
  { value: "bottom-right", label: "Inferior derecha" },
  { value: "bottom-left", label: "Inferior izquierda" },
  { value: "top-right", label: "Superior derecha" },
  { value: "top-left", label: "Superior izquierda" },
]

interface Step4AvailabilityProps {
  form: WidgetFormState
  setForm: React.Dispatch<React.SetStateAction<WidgetFormState>>
}

export function Step4Availability({ form, setForm }: Step4AvailabilityProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Section title="Captura de Correo" description="Pídele el correo al visitante al inicio de la conversación.">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Solicitar correo al visitante</div>
            <div className="text-xs text-muted-foreground">Si está activo, el bot pedirá el correo antes de responder.</div>
          </div>
          <Switch
            checked={form.leadCaptureEnabled}
            onCheckedChange={(v) => setForm((f) => ({ ...f, leadCaptureEnabled: v }))}
          />
        </div>
        {form.leadCaptureEnabled && (
          <Field label="Mensaje de solicitud">
            <Input
              value={form.leadCaptureMessage}
              onChange={(e) => setForm((f) => ({ ...f, leadCaptureMessage: e.target.value }))}
            />
          </Field>
        )}
      </Section>

      <Section title="Posición del Widget" description="Dónde flota la burbuja del chat en el sitio del cliente.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {POSITIONS.map((pos) => {
            const active = form.position === pos.value
            return (
              <button
                key={pos.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, position: pos.value }))}
                className={cn(
                  "relative rounded-lg border p-3 text-left transition-colors hover:border-primary/50",
                  active && "border-primary bg-primary/5"
                )}
              >
                <div className="relative h-16 overflow-hidden rounded-md border bg-muted/40">
                  <PositionDot position={pos.value} />
                </div>
                <div className="mt-2 text-xs font-medium">{pos.label}</div>
                {active && (
                  <CheckIcon className="absolute top-2 right-2 size-4 rounded-full bg-primary p-0.5 text-primary-foreground" />
                )}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Dominios Permitidos" description="Separa con comas. Vacío = todos los dominios.">
        <Input
          placeholder="ejemplo.com, app.ejemplo.com"
          value={form.allowedDomains}
          onChange={(e) => setForm((f) => ({ ...f, allowedDomains: e.target.value }))}
        />
      </Section>
    </div>
  )
}

function PositionDot({ position }: { position: WidgetPosition }) {
  const cls: Record<WidgetPosition, string> = {
    "bottom-right": "bottom-1.5 right-1.5",
    "bottom-left": "bottom-1.5 left-1.5",
    "top-right": "top-1.5 right-1.5",
    "top-left": "top-1.5 left-1.5",
  }
  return <div className={cn("absolute size-3 rounded-full bg-primary shadow-sm", cls[position])} />
}
