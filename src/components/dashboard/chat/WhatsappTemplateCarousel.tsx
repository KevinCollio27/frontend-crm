"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WhatsAppTemplatePreview } from "@/components/settings/whatsapp-templates/WhatsAppTemplatePreview"
import type { WhatsappTemplateView } from "@/types/ai-chat"

/**
 * Las tarjetas guardadas antes de mostrar cabecera/pie/botones solo traen nombre y cuerpo:
 * se completan los campos que faltan para que las conversaciones antiguas sigan abriendo.
 */
export function withDefaults(t: Partial<WhatsappTemplateView> & { name: string }): WhatsappTemplateView {
  return {
    name: t.name,
    category: t.category ?? null,
    variables: t.variables ?? 0,
    headerMode: t.headerMode ?? "none",
    headerText: t.headerText,
    headerImageUrl: t.headerImageUrl,
    body: t.body ?? "",
    footerText: t.footerText,
    buttons: t.buttons ?? [],
  }
}

interface WhatsappTemplateCarouselProps {
  templates: WhatsappTemplateView[]
  recommended?: string
  actionLabel: string
  disabled?: boolean
  onChoose: (templateName: string) => void
}

// Una plantilla a la vez, completa (imagen, pie y botones) como se ve en WhatsApp,
// con flechas para recorrer las demás. La recomendada por la IA va primera.
export function WhatsappTemplateCarousel({ templates, recommended, actionLabel, disabled = false, onChoose }: WhatsappTemplateCarouselProps) {
  const ordered = React.useMemo(() => {
    const all = templates.map(withDefaults)
    const rec = all.find((t) => t.name === recommended)
    return rec ? [rec, ...all.filter((t) => t.name !== recommended)] : all
  }, [templates, recommended])
  const [index, setIndex] = React.useState(0)

  if (ordered.length === 0) return null
  const current = ordered[Math.min(index, ordered.length - 1)]
  const isRecommended = current.name === recommended
  const go = (delta: number) => setIndex((i) => (i + delta + ordered.length) % ordered.length)

  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Button type="button" variant="outline" size="icon-sm" onClick={() => go(-1)} disabled={ordered.length < 2} aria-label="Plantilla anterior">
          <ChevronLeftIcon />
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="truncate text-sm font-medium">{current.name}</span>
            {current.category && (
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground">{current.category}</span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {Math.min(index, ordered.length - 1) + 1} / {ordered.length}
            {" · "}
            {current.variables === 0 ? "sin variables" : `${current.variables} variable${current.variables > 1 ? "s" : ""}`}
          </div>
        </div>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => go(1)} disabled={ordered.length < 2} aria-label="Plantilla siguiente">
          <ChevronRightIcon />
        </Button>
      </div>

      {isRecommended && (
        <div className="mb-2 flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <StarIcon className="size-3 fill-current" /> Recomendada
          </span>
        </div>
      )}

      <div className="mx-auto max-w-sm">
        <WhatsAppTemplatePreview
          headerMode={current.headerMode}
          headerText={current.headerText}
          headerImageUrl={current.headerImageUrl}
          bodyText={current.body}
          footerText={current.footerText}
          buttons={current.buttons}
        />
      </div>

      <div className="mt-3 flex justify-center">
        <Button type="button" size="sm" variant={isRecommended ? "default" : "outline"} disabled={disabled} onClick={() => onChoose(current.name)}>
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
