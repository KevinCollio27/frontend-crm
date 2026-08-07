"use client"

import * as React from "react"
import { toast } from "sonner"
import { campaignNotify } from "@/lib/notify"
import { LayoutTemplateIcon, Loader2Icon, MailIcon, SendIcon, UsersIcon, XIcon } from "lucide-react"
import { CampaignProgressToast } from "./CampaignProgressToast"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Stepper, type StepperStep } from "@/components/ui/stepper"
import { confirmDialog } from "@/lib/confirm"
import { campaignService, type CampaignDispatchPayload } from "@/services/campaign.service"
import { Step1Info } from "./steps/Step1Info"
import { Step2Audience } from "./steps/Step2Audience"
import { Step3Content } from "./steps/Step3Content"
import { Step4Review } from "./steps/Step4Review"
import { createEmptyCampaignForm, type CampaignFormState } from "./shared/form-state"
import type { CampaignBlock } from "./shared/blocks"

const STEPS: StepperStep[] = [
  { id: 1, label: "Información", icon: MailIcon },
  { id: 2, label: "Audiencia", icon: UsersIcon },
  { id: 3, label: "Contenido", icon: LayoutTemplateIcon },
  { id: 4, label: "Revisar", icon: SendIcon },
]

// ─── Variable transform ───────────────────────────────────────────────────────
// El backend reemplaza {{name}}, {{organization}}, {{email}}.
// El frontend muestra {{nombre}}, {{empresa}}, {{correo}}, etc.

function transformVars(text: string): string {
  return text
    .replace(/\{\{nombre\}\}/gi, "{{name}}")
    .replace(/\{\{empresa\}\}/gi, "{{organization}}")
    .replace(/\{\{correo\}\}/gi, "{{email}}")
    .replace(/\{\{ciudad\}\}/gi, "{{city}}")
    .replace(/\{\{fecha\}\}/gi, new Date().toLocaleDateString("es-CL"))
}

// ─── Blocks → HTML ───────────────────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function blocksToHtml(blocks: CampaignBlock[]): string {
  return blocks.map((b) => blockToHtml(b)).join("\n")
}

function blockToHtml(block: CampaignBlock): string {
  switch (block.type) {
    case "heading": {
      const d = block.data
      return `<${d.level} style="text-align:${d.align};color:${d.color};font-weight:${d.bold ? "bold" : "normal"};font-style:${d.italic ? "italic" : "normal"};">${esc(d.text)}</${d.level}>`
    }
    case "text": {
      const d = block.data
      const bg = d.backgroundColor ? `background:${d.backgroundColor};padding:12px 16px;border-radius:6px;` : ""
      return `<p style="text-align:${d.align};color:${d.color};font-size:14px;line-height:1.6;${bg}">${d.text.replace(/\n/g, "<br>")}</p>`
    }
    case "button": {
      const d = block.data
      return `<div style="text-align:${d.align};margin:16px 0;"><a href="${d.href || "#"}" style="display:inline-block;padding:12px 24px;background:${d.color};color:${d.textColor || "#fff"};border-radius:${d.radius ?? 6}px;text-decoration:none;font-size:14px;font-weight:600;">${esc(d.label)}</a></div>`
    }
    case "image": {
      const d = block.data
      if (!d.src) return ""
      const img = `<img src="${d.src}" alt="${esc(d.alt)}" style="width:${d.width};display:block;margin:0 auto;" />`
      return d.href ? `<a href="${d.href}">${img}</a>` : img
    }
    case "divider":
      return `<hr style="border:none;border-top:1px solid ${block.data.color};margin:16px 0;" />`
    case "spacer":
      return `<div style="height:${block.data.height}px;"></div>`
    case "hero": {
      const d = block.data
      return `<div style="background:${d.bg};color:${d.fg};padding:48px 32px;text-align:center;border-radius:8px;margin:8px 0;">
  <div style="font-size:24px;font-weight:bold;margin-bottom:8px;">${esc(d.title)}</div>
  ${d.subtitle ? `<div style="font-size:14px;opacity:0.9;margin-bottom:16px;">${esc(d.subtitle)}</div>` : ""}
  ${d.ctaLabel ? `<a href="${d.ctaHref || "#"}" style="display:inline-block;padding:10px 24px;background:#fff;color:#000;border-radius:6px;text-decoration:none;font-weight:600;">${esc(d.ctaLabel)}</a>` : ""}
</div>`
    }
    case "highlight": {
      const d = block.data
      return `<div style="border:2px dashed ${d.accentColor};border-radius:8px;padding:20px;text-align:center;background:${d.accentColor}1a;margin:8px 0;">
  ${d.label ? `<div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${d.accentColor};margin-bottom:6px;">${esc(d.label)}</div>` : ""}
  <div style="font-size:18px;font-weight:bold;color:#111;">${esc(d.message)}</div>
  ${d.code ? `<div style="display:inline-block;margin-top:12px;padding:6px 16px;border-radius:20px;background:#fff;color:${d.accentColor};border:1px solid ${d.accentColor};font-size:13px;font-weight:600;">${esc(d.code)}</div>` : ""}
</div>`
    }
    case "imageText": {
      const d = block.data
      const imgCell = d.src ? `<img src="${d.src}" alt="${esc(d.alt)}" style="width:100%;border-radius:4px;" />` : ""
      const txtCell = `<div style="font-size:15px;font-weight:600;color:#111;margin-bottom:6px;">${esc(d.title)}</div><p style="font-size:14px;color:#374151;line-height:1.6;margin:0;">${esc(d.text)}</p>`
      const [left, right] = d.imagePosition === "right" ? [txtCell, imgCell] : [imgCell, txtCell]
      return `<table style="width:100%;border-collapse:collapse;"><tr><td style="width:50%;padding-right:8px;vertical-align:middle;">${left}</td><td style="width:50%;padding-left:8px;vertical-align:middle;">${right}</td></tr></table>`
    }
    case "list": {
      const d = block.data
      const tag = d.style === "number" ? "ol" : "ul"
      return `<${tag} style="padding-left:20px;margin:8px 0;">${d.items.map((i) => `<li style="color:#374151;font-size:14px;line-height:1.6;">${esc(i)}</li>`).join("")}</${tag}>`
    }
    case "quote": {
      const d = block.data
      return `<blockquote style="border-left:4px solid #6366f1;padding:8px 16px;margin:12px 0;"><p style="font-style:italic;color:#374151;font-size:14px;margin:0 0 4px;">${esc(d.text)}</p>${d.author ? `<cite style="font-size:12px;color:#6b7280;">${esc(d.author)}</cite>` : ""}</blockquote>`
    }
    case "signature": {
      const d = block.data
      return `<div style="margin-top:16px;">${d.logoSrc ? `<img src="${d.logoSrc}" alt="Logo" style="width:${d.logoWidth};max-height:${d.logoMaxHeight};object-fit:contain;margin-bottom:8px;" /><br>` : ""}<strong style="color:#111;font-size:14px;">${esc(d.name)}</strong>${d.role ? `<br><span style="color:#6b7280;font-size:13px;">${esc(d.role)}</span>` : ""}${d.phone ? `<br><span style="color:#374151;font-size:13px;">${esc(d.phone)}</span>` : ""}${d.email ? `<br><a href="mailto:${d.email}" style="color:#2563eb;font-size:13px;">${esc(d.email)}</a>` : ""}${d.website ? `<br><a href="${d.website}" style="color:#2563eb;font-size:13px;">${esc(d.website)}</a>` : ""}</div>`
    }
    case "footer": {
      const d = block.data
      return `<div style="text-align:center;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:16px;font-size:12px;color:#6b7280;"><strong style="color:#111;">${esc(d.companyName)}</strong>${d.address ? `<br>${esc(d.address)}` : ""}<br><span style="text-decoration:underline;">${esc(d.unsubscribeText)}</span></div>`
    }
    case "social": {
      const d = block.data
      const links = [
        { href: d.facebook, label: "Facebook", color: "#1877F2" },
        { href: d.instagram, label: "Instagram", color: "#E1306C" },
        { href: d.linkedin, label: "LinkedIn", color: "#0A66C2" },
        { href: d.twitter, label: "X", color: "#000" },
      ].filter((i) => i.href)
      if (!links.length) return ""
      return `<div style="text-align:center;padding:12px 0;">${links.map((l) => `<a href="${l.href}" style="display:inline-block;margin:0 4px;padding:6px 12px;background:${l.color};color:#fff;border-radius:4px;text-decoration:none;font-size:12px;">${l.label}</a>`).join("")}</div>`
    }
    case "columns": {
      const d = block.data
      const w = Math.floor(100 / d.columns.length)
      return `<table style="width:100%;border-collapse:collapse;"><tr>${d.columns.map((c) => `<td style="width:${w}%;padding:8px;vertical-align:top;background:#f3f4f6;border-radius:4px;font-size:14px;color:#374151;">${esc(c)}</td>`).join("")}</tr></table>`
    }
    case "video":
      return block.data.href ? `<div style="text-align:center;"><a href="${block.data.href}"><img src="${block.data.thumbnail || ""}" alt="${esc(block.data.caption)}" style="width:100%;border-radius:8px;" /></a></div>` : ""
    default:
      return ""
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateCampaignSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialForm?: Partial<CampaignFormState>
}

export function CreateCampaignSheet({ open, onOpenChange, onSuccess, initialForm }: CreateCampaignSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 1400, padding: 0, gap: 0 }}
        className="w-full"
      >
        {open && <CampaignWizard onClose={() => onOpenChange(false)} onSuccess={onSuccess} initialForm={initialForm} />}
      </SheetContent>
    </Sheet>
  )
}

function CampaignWizard({ onClose, onSuccess, initialForm }: { onClose: () => void; onSuccess?: () => void; initialForm?: Partial<CampaignFormState> }) {
  const [step, setStep] = React.useState(1)
  const [form, setForm] = React.useState(() => ({ ...createEmptyCampaignForm(), ...initialForm }))
  const [sending, setSending] = React.useState(false)
  const bodyRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [step])

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const audienceOk =
    form.audienceMode === "crm"
      ? form.selectedContactIds.length > 0
      : form.customRecipients.some((r) => r.email.trim()) &&
        form.customRecipients.every((r) => !r.email.trim() || EMAIL_RE.test(r.email.trim()))

  const canNext =
    (step === 1 && form.name.trim().length > 0 && form.subject.trim().length > 0) ||
    (step === 2 && audienceOk) ||
    step === 3 ||
    step === 4

  function handleNext() {
    if (!canNext) return
    setStep((s) => Math.min(4, s + 1))
  }

  async function handleSubmit() {
    if (!form.name.trim()) { campaignNotify.error("Falta el nombre de la campaña"); setStep(1); return }
    if (!form.subject.trim()) { campaignNotify.error("Falta el asunto del correo"); setStep(1); return }
    if (!audienceOk) { campaignNotify.error("Falta seleccionar al menos un destinatario"); setStep(2); return }

    const recipientCount =
      form.audienceMode === "crm"
        ? form.selectedContactIds.length
        : form.customRecipients.filter((r) => r.email.trim()).length

    const ok = await confirmDialog({
      title: "¿Enviar campaña?",
      description: `Se enviarán emails a ${recipientCount} destinatario(s). Esta acción no se puede deshacer.`,
      confirmText: "Sí, enviar",
      cancelText: "Cancelar",
      tone: "warning",
    })
    if (!ok) return

    // Convertir contenido a HTML
    let message = ""
    if (form.contentMode === "blocks") message = blocksToHtml(form.blocks)
    else if (form.contentMode === "html") message = form.htmlContent
    else if (form.contentMode === "text") message = form.textContent.replace(/\n/g, "<br>")
    else message = form.htmlContent || form.textContent

    message = transformVars(message)
    const subject = transformVars(form.subject)

    const payload: CampaignDispatchPayload = {
      campaignName: form.name,
      audience: form.audienceMode === "custom" ? "custom_list" : "specific",
      subject,
      message,
      personIds: form.audienceMode === "crm" ? form.selectedContactIds : undefined,
      organizationId: form.crmFilterOrganizationId ?? undefined,
      customRecipients: form.audienceMode === "custom"
        ? form.customRecipients.filter((r) => r.email.trim()).map((r) => ({ name: r.name, email: r.email }))
        : undefined,
      blocksJson: form.contentMode === "blocks" && form.blocks.length > 0 ? form.blocks : undefined,
    }

    setSending(true)
    try {
      const result = await campaignService.dispatch(payload)
      onSuccess?.()
      onClose()
      // Mostrar toast de progreso en tiempo real
      const toastId = toast.custom(
        () => (
          <CampaignProgressToast
            campaignId={result.dispatchId}
            campaignName={form.name}
            total={result.contactCount}
            onDone={() => { onSuccess?.(); toast.dismiss(toastId) }}
          />
        ),
        { duration: Infinity, position: "bottom-right" }
      )
    } catch (err: any) {
      campaignNotify.error(err?.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <SheetTitle>Crear Campaña</SheetTitle>
            <SheetDescription>Diseña y envía una campaña de email a tu audiencia.</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>
        <Stepper steps={STEPS} current={step} />
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 sm:p-6">
        {step === 1 && <Step1Info form={form} setForm={setForm} />}
        {step === 2 && <Step2Audience form={form} setForm={setForm} />}
        {step === 3 && <Step3Content form={form} setForm={setForm} />}
        {step === 4 && <Step4Review form={form} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-5 py-3.5 sm:px-6">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose} disabled={sending}>
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || sending}>
            Anterior
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={handleNext} disabled={!canNext}>
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={sending}>
              {sending
                ? <><Loader2Icon className="size-4 animate-spin" /> Enviando...</>
                : <><SendIcon className="size-4" /> Enviar Campaña</>
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
