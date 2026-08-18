"use client"

import { ExternalLinkIcon } from "lucide-react"
import type { WhatsappTemplateRaw } from "@/types/whatsapp"

export interface PreviewButton {
  text: string
  url?: string
}

interface WhatsAppTemplatePreviewProps {
  headerMode: "none" | "text" | "image"
  headerText?: string
  headerImageUrl?: string
  bodyText: string
  footerText?: string
  buttons: PreviewButton[]
}

/** Extrae header/body/footer/botones de los `components` que devuelve el cache local. */
export function parseTemplateForPreview(template: WhatsappTemplateRaw): WhatsAppTemplatePreviewProps {
  const components = template.components ?? []
  const header = components.find((c) => c.type === "HEADER")
  const body = components.find((c) => c.type === "BODY")
  const footer = components.find((c) => c.type === "FOOTER")
  const buttonsComponent = components.find((c) => c.type === "BUTTONS")

  const headerMode: "none" | "text" | "image" = !header ? "none" : header.format === "IMAGE" ? "image" : "text"

  // El caché puede traer la URL propia (guardada al crear el template) o, si vino
  // de una sincronización con Meta, solo el header_handle — una URL de su CDN que
  // igual sirve para mostrarla, aunque a diferencia de la nuestra puede expirar.
  const headerImageUrl = header?.url || header?.example?.header_handle?.[0]

  return {
    headerMode,
    headerText: header?.text,
    headerImageUrl,
    bodyText: body?.text ?? template.body_text ?? "",
    footerText: footer?.text,
    buttons: (buttonsComponent?.buttons ?? []).map((b) => ({ text: b.text, url: b.url })),
  }
}

export function WhatsAppTemplatePreview({
  headerMode,
  headerText,
  headerImageUrl,
  bodyText,
  footerText,
  buttons,
}: WhatsAppTemplatePreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-[#e5ddd5] p-4 dark:bg-[#0b141a]">
      <div className="rounded-lg bg-white shadow-sm dark:bg-[#202c33]">
        {headerMode === "image" && headerImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={headerImageUrl} alt="" className="max-h-40 w-full rounded-t-lg object-cover" />
        )}
        <div className="space-y-1.5 p-3">
          {headerMode === "text" && headerText && (
            <p className="text-sm font-semibold text-foreground dark:text-white">{headerText}</p>
          )}
          <p className="text-sm whitespace-pre-line text-foreground dark:text-white">{bodyText}</p>
          {footerText && <p className="text-xs text-muted-foreground">{footerText}</p>}
          <p className="pt-1 text-right text-[10px] text-muted-foreground">
            {new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {buttons.length > 0 && (
        <div className="mt-1 space-y-px overflow-hidden rounded-lg bg-white shadow-sm dark:bg-[#202c33]">
          {buttons.map((b, i) => (
            <div
              key={`${b.text}-${i}`}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-sky-600 dark:text-sky-400 ${i > 0 ? "border-t" : ""}`}
            >
              <ExternalLinkIcon className="size-3.5" />
              {b.text || "Botón"}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
