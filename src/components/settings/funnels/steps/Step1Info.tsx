import * as React from "react"

import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import { Switch } from "@/components/ui/switch"
import type { FunnelFormState } from "../shared/form-state"

interface Step1InfoProps {
  form: FunnelFormState
  setForm: React.Dispatch<React.SetStateAction<FunnelFormState>>
}

export function Step1Info({ form, setForm }: Step1InfoProps) {
  return (
    <div className="space-y-5">
      <Section title="Información del Embudo" description="Cómo se llama y si es el embudo por defecto.">
        <Field label="Nombre" required>
          <Input
            placeholder="ej. Ventas B2B"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="text-sm font-medium">Embudo Principal</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Se usará por defecto al crear nuevas oportunidades.
            </p>
          </div>
          <Switch
            checked={form.isDefault}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isDefault: v }))}
          />
        </div>
      </Section>
    </div>
  )
}
