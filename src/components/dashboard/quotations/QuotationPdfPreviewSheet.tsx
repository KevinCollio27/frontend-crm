"use client"

import * as React from "react"
import { Loader2Icon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { getQuotationPdfBlob } from "./shared/download-pdf"

interface Props {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  quotationId:   number | null
  quotationName?: string
}

export function QuotationPdfPreviewSheet({ open, onOpenChange, quotationId, quotationName }: Props) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const prevUrlRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!open || !quotationId) return
    setPreviewUrl(null)
    let cancelled = false

    getQuotationPdfBlob(quotationId)
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
        prevUrlRef.current = url
        setPreviewUrl(url)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [open, quotationId])

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
              {quotationName ? `${quotationName} — ` : ""}PDF real tal como se descarga o se envía.
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
            <iframe src={previewUrl} className="h-full w-full border-0" title="Vista previa de la cotización" />
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
