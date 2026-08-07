"use client"

import * as React from "react"
import { pdf } from "@react-pdf/renderer"
import { Loader2Icon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import QuotationPDF from "@/components/dashboard/quotations/QuotationPDF"
import { parseHtmlToBlocks, resolveTemplateVariables } from "@/lib/htmlToBlocks"
import type { PdfTemplate, ResolvedTemplateBlock } from "@/types/pdfTemplate"
import { MOCK_QUOTATION } from "./mock-quotation"

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  template:     PdfTemplate | null
}

export function PdfTemplatePreviewSheet({ open, onOpenChange, template }: Props) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const prevUrlRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!open || !template) return
    setPreviewUrl(null)
    let cancelled = false

    const resolvedBlocks: ResolvedTemplateBlock[] = template.blocks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((b) => ({
        title:         b.title,
        position:      b.position,
        order:         b.order,
        parsedContent: parseHtmlToBlocks(resolveTemplateVariables(b.content, MOCK_QUOTATION)),
      }))

    pdf(<QuotationPDF quotation={MOCK_QUOTATION} resolvedBlocks={resolvedBlocks} />).toBlob()
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
        prevUrlRef.current = url
        setPreviewUrl(url)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [open, template])

  React.useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    }
  }, [])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 1400, padding: 0, gap: 0 }}
        className="flex w-full flex-col"
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="space-y-0.5">
            <SheetTitle>Vista previa</SheetTitle>
            <SheetDescription>
              {template?.name} — con datos de ejemplo, así se vería el PDF final.
            </SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden bg-muted/30">
          {previewUrl ? (
            <iframe src={previewUrl} className="h-full w-full border-0" title="Vista previa de la plantilla PDF" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2Icon className="size-6 animate-spin opacity-50" />
              <p className="text-xs">Generando vista previa...</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
