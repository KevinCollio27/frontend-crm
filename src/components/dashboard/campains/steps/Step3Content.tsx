import * as React from "react"
import { toast } from "sonner"
import { CalendarHeartIcon, Code2Icon, FileCodeIcon, HandshakeIcon, LayoutTemplateIcon, LockIcon, MegaphoneIcon, MessageSquareIcon, ShieldIcon, SparklesIcon, TagIcon, Trash2Icon, TypeIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/ui/field"
import { Section } from "@/components/ui/section"
import { BlockEditor } from "./BlockEditor"
import type { CampaignFormState, ContentMode } from "../shared/form-state"
import type { CampaignBlock } from "../shared/blocks"
import { CAMPAIGN_TEMPLATES } from "../shared/templates"
import { confirmDialog } from "@/lib/confirm"
import { cn } from "@/lib/utils"

const TEMPLATE_ICON: Record<string, React.ElementType> = {
  blank:        LayoutTemplateIcon,
  bienvenida:   HandshakeIcon,
  captacion:    MegaphoneIcon,
  seguimiento:  MessageSquareIcon,
  oferta:       TagIcon,
  festividades: CalendarHeartIcon,
}

const CONTENT_MODE_LABEL: Record<ContentMode, string> = {
  blocks: "Bloques",
  html: "HTML",
  text: "Texto plano",
  template: "Template ID",
  ai: "IA",
}

const AI_TONES = [
  { value: "profesional", label: "Profesional" },
  { value: "cercano", label: "Cercano" },
  { value: "urgente", label: "Urgente" },
  { value: "formal", label: "Formal" },
  { value: "divertido", label: "Divertido" },
]

const SAMPLE_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #111827;">Hola {{nombre}} 👋</h1>
  <p style="color: #374151; line-height: 1.6;">Tenemos una oferta especial pensada para ti en {{empresa}}.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="#" style="background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Ver oferta</a>
  </div>
  <p style="color: #9ca3af; font-size: 12px;">Si no deseas recibir más correos, puedes darte de baja aquí.</p>
</div>`

interface Step3ContentProps {
  form: CampaignFormState
  setForm: React.Dispatch<React.SetStateAction<CampaignFormState>>
}

export function Step3Content({ form, setForm }: Step3ContentProps) {
  const [htmlView, setHtmlView] = React.useState<"editor" | "preview">("editor")
  const [aiGenerated, setAiGenerated] = React.useState<string | null>(null)
  const [activeTemplate, setActiveTemplate] = React.useState<string | null>(null)

  function setBlocks(updater: (blocks: CampaignBlock[]) => CampaignBlock[]) {
    setForm((f) => ({ ...f, blocks: updater(f.blocks) }))
  }

  async function applyTemplate(templateId: string) {
    const tpl = CAMPAIGN_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    if (form.blocks.length > 0 && activeTemplate !== templateId) {
      const ok = await confirmDialog({
        title: "¿Cambiar plantilla?",
        description: "Esto reemplazará el contenido actual con la nueva plantilla.",
        confirmText: "Cambiar",
        cancelText: "Cancelar",
        tone: "warning",
      })
      if (!ok) return
    }
    setForm((f) => ({ ...f, blocks: tpl.makeBlocks(), contentMode: "blocks" }))
    setActiveTemplate(templateId)
  }

  async function loadSampleHtml() {
    if (form.htmlContent) {
      const ok = await confirmDialog({ title: "¿Reemplazar HTML?", description: "Esto reemplazará el HTML actual.", confirmText: "Reemplazar", cancelText: "Cancelar", tone: "warning" })
      if (!ok) return
    }
    setForm((f) => ({ ...f, htmlContent: SAMPLE_HTML }))
  }

  async function clearHtml() {
    const ok = await confirmDialog({ title: "¿Limpiar HTML?", description: "Esta acción no se puede deshacer.", confirmText: "Limpiar", cancelText: "Cancelar", tone: "danger" })
    if (!ok) return
    setForm((f) => ({ ...f, htmlContent: "" }))
  }

  async function generateTextFromHtml() {
    if (form.textContent) {
      const ok = await confirmDialog({ title: "¿Reemplazar texto?", description: "Esto reemplazará el texto actual.", confirmText: "Reemplazar", cancelText: "Cancelar", tone: "warning" })
      if (!ok) return
    }
    const plain = form.htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
    setForm((f) => ({ ...f, textContent: plain }))
  }

  function generateMockAi() {
    if (!form.aiPrompt.trim()) {
      toast.error("Escribe primero las instrucciones para la IA")
      return
    }
    const toneLabel = AI_TONES.find((t) => t.value === form.aiTone)?.label ?? "Profesional"
    const trimmedPrompt = form.aiPrompt.length > 90 ? `${form.aiPrompt.slice(0, 90)}…` : form.aiPrompt
    setAiGenerated(
      `Hola {{nombre}} 👋\n\nA partir de tus instrucciones (“${trimmedPrompt}”), aquí tienes un borrador en tono ${toneLabel.toLowerCase()}:\n\n` +
        `Tenemos una propuesta pensada especialmente para {{empresa}}. Cuéntanos qué necesitas y te ayudamos a resolverlo rápido.\n\n` +
        `[Vista de ejemplo — esto se conectará a un modelo de IA real más adelante]`
    )
    toast.success("Contenido de ejemplo generado")
  }

  return (
    <div className="space-y-5">

      {/* ── Galería de plantillas ── */}
      <Section title="Plantilla de inicio" description="Elige un punto de partida y edita desde ahí. Puedes cambiarla en cualquier momento.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CAMPAIGN_TEMPLATES.map((tpl) => {
            const Icon = TEMPLATE_ICON[tpl.id] ?? LayoutTemplateIcon
            const active = activeTemplate === tpl.id
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all hover:border-foreground/30",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border"
                )}
              >
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-md",
                  active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{tpl.name}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{tpl.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      <Section
        title="Contenido del Mensaje"
        description="Elige el formato que prefieras."
        actions={
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            Se enviará en: <span className="font-semibold text-foreground">{CONTENT_MODE_LABEL[form.contentMode]}</span>
          </Badge>
        }
      >
        <Tabs
          value={form.contentMode}
          onValueChange={(v) => setForm((f) => ({ ...f, contentMode: v as ContentMode }))}
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="blocks">
              <LayoutTemplateIcon className="size-3.5" /> Bloques
            </TabsTrigger>
            <TabsTrigger value="html">
              <Code2Icon className="size-3.5" /> HTML
            </TabsTrigger>
            <TabsTrigger value="text">
              <TypeIcon className="size-3.5" /> Texto
            </TabsTrigger>
            <TabsTrigger value="template" disabled className="cursor-not-allowed opacity-40">
              <LockIcon className="size-3" /> Template ID
            </TabsTrigger>
            <TabsTrigger value="ai" disabled className="cursor-not-allowed opacity-40">
              <LockIcon className="size-3" /> IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blocks" className="mt-4">
            <BlockEditor blocks={form.blocks} setBlocks={setBlocks} />
          </TabsContent>

          <TabsContent value="html" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 rounded-lg border p-0.5">
                <Button type="button" size="sm" variant={htmlView === "editor" ? "default" : "ghost"} className="flex-1" onClick={() => setHtmlView("editor")}>
                  Editor
                </Button>
                <Button type="button" size="sm" variant={htmlView === "preview" ? "default" : "ghost"} className="flex-1" onClick={() => setHtmlView("preview")}>
                  Vista previa
                </Button>
              </div>
              {htmlView === "editor" && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="xs" onClick={loadSampleHtml}>
                    Cargar ejemplo
                  </Button>
                  {form.htmlContent && (
                    <Button type="button" variant="ghost" size="xs" className="text-muted-foreground" onClick={clearHtml}>
                      <Trash2Icon className="size-3" /> Limpiar
                    </Button>
                  )}
                </div>
              )}
            </div>

            {htmlView === "editor" ? (
              <Textarea
                value={form.htmlContent}
                onChange={(e) => setForm((f) => ({ ...f, htmlContent: e.target.value }))}
                rows={16}
                className="font-mono text-xs"
                placeholder="<div>...</div>"
              />
            ) : (
              <div className="min-h-100 rounded-lg border bg-white p-4">
                {form.htmlContent ? (
                  // eslint-disable-next-line react/no-danger
                  <div className="mx-auto max-w-150" dangerouslySetInnerHTML={{ __html: form.htmlContent }} />
                ) : (
                  <p className="py-16 text-center text-sm" style={{ color: "#9ca3af" }}>
                    La vista previa aparecerá aquí.
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Soporta variables como <code className="rounded bg-muted px-1">{"{{nombre}}"}</code> y{" "}
              <code className="rounded bg-muted px-1">{"{{empresa}}"}</code>.
            </p>
          </TabsContent>

          <TabsContent value="text" className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Versión en texto plano — sin negrita, colores ni HTML. Es el respaldo que usan los lectores de
                correo que no muestran HTML (y lo que evalúan los filtros de spam).
              </p>
              {form.htmlContent && (
                <Button type="button" variant="outline" size="xs" className="shrink-0" onClick={generateTextFromHtml}>
                  Generar desde HTML
                </Button>
              )}
            </div>
            <Textarea
              value={form.textContent}
              onChange={(e) => setForm((f) => ({ ...f, textContent: e.target.value }))}
              rows={14}
              placeholder="Escribe la versión en texto plano de tu correo..."
            />
          </TabsContent>

          <TabsContent value="template" className="mt-4">
            <ComingSoon
              icon={FileCodeIcon}
              title="Template ID"
              description="Envía usando tus plantillas dinámicas de SendGrid. Configura el ID directamente desde tu cuenta."
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <ComingSoon
              icon={SparklesIcon}
              title="Generación con IA"
              description="Genera el contenido del correo a partir de tus instrucciones usando un modelo de lenguaje."
            />
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  )
}

function ComingSoon({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        Próximamente
      </span>
    </div>
  )
}
