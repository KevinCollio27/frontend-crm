import * as React from "react"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"
import { Section } from "@/components/ui/section"
import type { CampaignFormState } from "../shared/form-state"

const MERGE_TAGS = [
  { tag: "{{nombre}}", desc: "Nombre del contacto" },
  { tag: "{{empresa}}", desc: "Nombre de la organización" },
  { tag: "{{correo}}", desc: "Correo del contacto" },
  { tag: "{{ciudad}}", desc: "Ciudad del contacto" },
  { tag: "{{fecha}}", desc: "Fecha de envío" },
]

interface Step1InfoProps {
  form: CampaignFormState
  setForm: React.Dispatch<React.SetStateAction<CampaignFormState>>
}

export function Step1Info({ form, setForm }: Step1InfoProps) {
  const subjectRef = React.useRef<HTMLInputElement>(null)

  function insertTag(tag: string) {
    const el = subjectRef.current
    if (!el) return
    const start = el.selectionStart ?? form.subject.length
    const end = el.selectionEnd ?? form.subject.length
    const next = form.subject.slice(0, start) + tag + form.subject.slice(end)
    setForm((f) => ({ ...f, subject: next }))
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + tag.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Section title="Información General" description="Identifica tu campaña.">
        <Field label="Nombre de la Campaña" required>
          <Input
            placeholder="Ej: Promoción Verano 2026"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
      </Section>

      <Section title="Asunto" description="Lo primero que verá el destinatario.">
        <Field label="Asunto" required>
          <Input
            ref={subjectRef}
            placeholder="Hola {{nombre}}, una oferta para {{empresa}}"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          />
        </Field>
        <Field label="Preheader (texto de previsualización)">
          <Input
            placeholder="Descúbrelo antes de que termine el mes"
            value={form.preheader}
            onChange={(e) => setForm((f) => ({ ...f, preheader: e.target.value }))}
          />
        </Field>

        <div className="pt-1">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Variables disponibles — clic para insertar en el asunto
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MERGE_TAGS.map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() => insertTag(t.tag)}
                title={t.desc}
                className="rounded border bg-background px-2 py-1 font-mono text-xs transition-colors hover:bg-muted"
              >
                {t.tag}
              </button>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}
