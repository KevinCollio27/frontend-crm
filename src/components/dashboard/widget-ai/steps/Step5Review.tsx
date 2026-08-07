import * as React from "react"
import { ArrowRightIcon, ChevronDownIcon, CopyIcon, MonitorSmartphoneIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import type { WidgetFormState, WidgetPosition } from "../shared/form-state"

interface Step5ReviewProps {
  form: WidgetFormState
}

export function Step5Review({ form }: Step5ReviewProps) {
  const activeActions = [
    form.actionSchedule && "Agendar Reunión",
    form.actionLead && "Capturar Lead",
    form.actionOpportunity && "Crear Oportunidad",
    form.actionHuman && "Transferir a Humano",
    form.actionResource && "Enviar Documento",
  ].filter(Boolean) as string[]

  const slug = form.name.toLowerCase().trim().replace(/\s+/g, "-") || "widget"
  const embed = `<script\n  src="https://api-crm.goxt.io/api/widget/embed.js"\n  data-api-key="SE_GENERARÁ_AL_CREAR"\n  data-widget="${slug}"\n></script>`

  function copyEmbed() {
    navigator.clipboard.writeText(embed)
    toast.success("Código copiado")
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <Section title="Resumen" description="Verifica antes de crear el widget.">
          <div className="grid gap-3 sm:grid-cols-2">
            <ReviewRow label="Widget" value={form.name || "—"} />
            <ReviewRow label="Asistente" value={form.chatTitle || "—"} />
            <ReviewRow label="Conocimiento" value={`${form.docFiles.length} doc · ${form.faqs.length} FAQ`} />
            <ReviewRow
              label="Captura de Correo"
              value={form.leadCaptureEnabled ? "Activada" : "Desactivada"}
            />
          </div>
        </Section>

        <Section title="Acciones activas">
          <div className="flex flex-wrap gap-1.5">
            {activeActions.length === 0 ? (
              <span className="text-sm text-muted-foreground">Ninguna acción configurada.</span>
            ) : (
              activeActions.map((a) => (
                <Badge key={a} variant="secondary" className="text-xs">
                  {a}
                </Badge>
              ))
            )}
          </div>
        </Section>

        <Section
          title="Código Embed"
          actions={
            <Button type="button" variant="outline" size="sm" onClick={copyEmbed}>
              <CopyIcon className="size-3.5" /> Copiar
            </Button>
          }
        >
          <pre className="overflow-x-auto rounded-md border bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap">
            {embed}
          </pre>
          <p className="text-xs text-muted-foreground">El API Key se generará al crear el widget.</p>
        </Section>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MonitorSmartphoneIcon className="size-3.5" /> Vista previa en vivo
        </div>
        <BrowserPreview form={form} />
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</div>
      <div className="truncate text-sm">{value}</div>
    </div>
  )
}

function BrowserPreview({ form }: { form: WidgetFormState }) {
  const chatPos: Record<WidgetPosition, string> = {
    "bottom-right": "bottom-3 right-3 items-end",
    "bottom-left": "bottom-3 left-3 items-start",
    "top-right": "top-3 right-3 items-end",
    "top-left": "top-3 left-3 items-start",
  }
  const faqs = form.faqs.slice(0, 3)

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-yellow-400/70" />
        <span className="size-2.5 rounded-full bg-green-400/70" />
        <div className="ml-3 flex h-5 flex-1 items-center rounded border bg-background/60 px-2 text-[10px] text-muted-foreground">
          https://cliente.com
        </div>
      </div>
      <div className="relative h-115 bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="space-y-2 p-5">
          <div className="h-3 w-2/3 rounded bg-foreground/10" />
          <div className="h-3 w-1/2 rounded bg-foreground/10" />
          <div className="mt-3 h-20 w-full rounded bg-foreground/5" />
        </div>

        <div className={`absolute flex flex-col gap-2 ${chatPos[form.position]}`}>
          <div className="w-75 overflow-hidden rounded-2xl border bg-background shadow-xl">
            <div
              className="flex items-center gap-2 px-4 py-3 text-white"
              style={{ background: form.brandColor }}
            >
              <div className="grid size-7 place-items-center rounded-full bg-white/20">
                <SparklesIcon className="size-3.5" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">{form.chatTitle || "Asistente"}</div>
                <div className="flex items-center gap-1 text-[10px] opacity-80">
                  <span className="size-1.5 rounded-full bg-green-400" /> En línea
                </div>
              </div>
              <ChevronDownIcon className="ml-auto size-4 opacity-80" />
            </div>
            <div className="max-h-57 space-y-2 overflow-y-auto bg-muted/20 p-3">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border bg-background px-3 py-2 text-xs">
                {form.welcomeMessage}
              </div>
              {faqs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {faqs.map((f) => (
                    <span
                      key={f.id}
                      className="rounded-full border px-2.5 py-1.5 text-[11px]"
                      style={{ borderColor: `${form.brandColor}55`, color: form.brandColor }}
                    >
                      {f.question || "Pregunta"}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-t px-3 py-2">
              <input
                className="h-8 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                placeholder="Escribe tu mensaje…"
                disabled
              />
              <button
                type="button"
                className="grid size-7 shrink-0 place-items-center rounded-md text-white"
                style={{ background: form.brandColor }}
              >
                <ArrowRightIcon className="size-3.5" />
              </button>
            </div>
          </div>
          <div
            className="grid size-12 shrink-0 place-items-center self-end rounded-full shadow-lg"
            style={{ background: form.brandColor }}
          >
            <SparklesIcon className="size-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
