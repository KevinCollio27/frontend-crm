"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, ExternalLinkIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { notify } from "@/lib/notify"
import type { FormRaw } from "@/types/form"

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button size="sm" variant="secondary" className="h-7 shrink-0 gap-1.5 text-xs" onClick={handleCopy}>
      {copied
        ? <><CheckIcon className="size-3" /> Copiado</>
        : <><CopyIcon className="size-3" /> {label ?? "Copiar"}</>
      }
    </Button>
  )
}

export function FormIntegrateSheet({
  open,
  onOpenChange,
  form,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  form: FormRaw | null
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? ""
  const slug = form?.slug ?? ""

  const directUrl = `${origin}/widget/form/${slug}`
  const iframeCode = `<iframe\n  src="${directUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border:none; border-radius:16px;"\n  title="${form?.name ?? ""}"\n></iframe>`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 560, padding: 0, gap: 0 }} className="w-full">
        {/* Header */}
        <div className="flex items-start justify-between border-b p-5">
          <div className="space-y-0.5">
            <SheetTitle>Integrar formulario</SheetTitle>
            <SheetDescription>{form?.name}</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* URL directa */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">URL directa</p>
            <p className="text-xs text-muted-foreground">Comparte este enlace o úsalo para que tus clientes accedan al formulario.</p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs">{directUrl}</code>
              <CopyButton value={directUrl} label="" />
              <Button size="sm" variant="outline" className="h-7 w-7 shrink-0 p-0" onClick={() => window.open(directUrl, "_blank")}>
                <ExternalLinkIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* iframe */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Código para incrustar (iframe)</p>
            <p className="text-xs text-muted-foreground">Pega este código en el HTML de tu sitio web donde quieras mostrar el formulario.</p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-[12px] leading-relaxed text-zinc-100">
                <code>{iframeCode}</code>
              </pre>
              <div className="absolute top-2.5 right-2.5">
                <CopyButton value={iframeCode} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ajusta <code className="rounded bg-muted px-1 font-mono">height</code> según el largo de tu formulario. El diseño lo controlamos nosotros.
            </p>
          </div>

          {/* API nativa (headless) */}
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">API nativa (headless)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Trae los campos y arma tu propio diseño — sin iframe, con tu ritmo (puedes mostrar de a pocos campos por vez).
                Las respuestas igual quedan unificadas en Respuestas.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Traer los campos del formulario</p>
              <code className="block truncate rounded border bg-background px-2.5 py-1.5 font-mono text-[11px] text-primary">
                GET {apiBaseUrl}/api/widget/form/{slug}
              </code>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Enviar una respuesta</p>
              <code className="block truncate rounded border bg-background px-2.5 py-1.5 font-mono text-[11px] text-primary">
                POST {apiBaseUrl}/api/widget/form/{slug}/submit
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-5">
          <SheetClose render={<Button variant="outline" className="w-full" />}>
            Cerrar
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
