import * as React from "react"

import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import type { ProductFormState } from "../shared/form-state"

interface Step1InfoProps {
  form: ProductFormState
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>
}

export function Step1Info({ form, setForm }: Step1InfoProps) {
  return (
    <div className="space-y-5">
      <Section title="Información del Producto" description="Nombre con el que se identifica en el catálogo.">
        <Field label="Nombre" required>
          <Input
            placeholder="ej. Flete Nacional"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
      </Section>
    </div>
  )
}
