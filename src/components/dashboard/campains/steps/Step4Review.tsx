import { Badge } from "@/components/ui/badge"
import { Section } from "@/components/ui/section"
import { BlockRender } from "./BlockEditor"
import type { CampaignFormState, ContentMode } from "../shared/form-state"

const CONTENT_MODE_LABEL: Record<ContentMode, string> = {
  blocks: "Bloques",
  html: "HTML",
  text: "Texto plano",
  template: "Template ID",
  ai: "IA",
}

interface Step4ReviewProps {
  form: CampaignFormState
}

export function Step4Review({ form }: Step4ReviewProps) {
  const audienceSummary =
    form.audienceMode === "crm"
      ? form.selectedContactIds.length > 0
        ? `${form.selectedContactIds.length} contacto(s) seleccionados`
        : form.crmFilter === "organization"
          ? `Organización: ${form.crmFilterOrganization || "—"}`
          : form.crmFilter === "recent"
            ? "Contactos recientes (últimos 30 días)"
            : "Todos los contactos con email"
      : `${form.customRecipients.filter((r) => r.email.trim()).length} destinatario(s) personalizado(s)`

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Section title="Resumen" description="Verifica antes de enviar la campaña.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ReviewRow label="Nombre" value={form.name || "—"} />
          <ReviewRow label="Estado" value={<Badge variant="outline">Borrador</Badge>} />
          <ReviewRow label="Audiencia" value={audienceSummary} />
          <ReviewRow label="Envío" value="Inmediato" />
          <ReviewRow label="Asunto" value={form.subject || "—"} />
          {form.preheader && <ReviewRow label="Preheader" value={form.preheader} />}
          <ReviewRow label="Formato" value={CONTENT_MODE_LABEL[form.contentMode]} />
        </div>
      </Section>

      <Section title="Vista previa" description="Así se verá el contenido del correo.">
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 border-b pb-3 text-xs" style={{ color: "#6b7280" }}>
            <div>
              <span className="font-semibold" style={{ color: "#111111" }}>De:</span>{" "}
              GOXT CRM &lt;contacto@mail.goxt.io&gt;
            </div>
            <div>
              <span className="font-semibold" style={{ color: "#111111" }}>Asunto:</span>{" "}
              {form.subject || "—"}
            </div>
          </div>
          <div className="mx-auto max-w-150 space-y-2">
            {form.contentMode === "blocks" &&
              (form.blocks.length > 0 ? (
                form.blocks.map((b) => <BlockRender key={b.id} block={b} />)
              ) : (
                <p className="py-12 text-center text-sm" style={{ color: "#9ca3af" }}>No se agregaron bloques.</p>
              ))}
            {form.contentMode === "html" &&
              (form.htmlContent ? (
                // eslint-disable-next-line react/no-danger
                <div dangerouslySetInnerHTML={{ __html: form.htmlContent }} />
              ) : (
                <p className="py-12 text-center text-sm" style={{ color: "#9ca3af" }}>No se escribió HTML.</p>
              ))}
            {form.contentMode === "text" &&
              (form.textContent ? (
                <pre className="font-sans text-sm whitespace-pre-wrap" style={{ color: "#374151" }}>{form.textContent}</pre>
              ) : (
                <p className="py-12 text-center text-sm" style={{ color: "#9ca3af" }}>No se escribió texto.</p>
              ))}
            {form.contentMode === "ai" && (
              <p className="text-sm italic" style={{ color: "#6b7280" }}>
                {form.aiPrompt
                  ? `La IA generará el contenido a partir de: «${form.aiPrompt.slice(0, 140)}${form.aiPrompt.length > 140 ? "…" : ""}»`
                  : "Sin instrucciones para la IA."}
              </p>
            )}
          </div>
        </div>
      </Section>
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
