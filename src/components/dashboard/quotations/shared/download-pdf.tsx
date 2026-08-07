import React from "react"
import { pdf } from "@react-pdf/renderer"
import QuotationPDF from "@/components/dashboard/quotations/QuotationPDF"
import { quotationService } from "@/services/quotation.service"
import { pdfTemplateService } from "@/services/pdfTemplate.service"
import { quotationHistoryService } from "@/services/quotationHistory.service"
import { notify } from "@/lib/notify"
import { parseHtmlToBlocks, resolveTemplateVariables } from "@/lib/htmlToBlocks"
import type { ResolvedTemplateBlock } from "@/types/pdfTemplate"

// ─── Cache ────────────────────────────────────────────────────────────────────

const quotationCache = new Map<number, Promise<any>>()
const blobCache      = new Map<number, Promise<Blob>>()
const templateByIdCache = new Map<number, Promise<any>>()
let workspaceDefaultCache: Promise<any> | null = null

function getTemplateByIdPromise(id: number) {
  if (!templateByIdCache.has(id)) {
    templateByIdCache.set(id, pdfTemplateService.getById(id).catch(() => null))
  }
  return templateByIdCache.get(id)!
}

function getWorkspaceDefaultPromise() {
  if (!workspaceDefaultCache) {
    workspaceDefaultCache = pdfTemplateService.getDefault().catch(() => null)
  }
  return workspaceDefaultCache
}

/**
 * Resuelve qué plantilla usar para esta cotización, en 3 niveles:
 * override de la cotización → default de la oportunidad → default del workspace.
 * Cada nivel cae al siguiente si la plantilla fue borrada o no tiene bloques.
 */
async function resolveTemplateForQuotation(fullQuotation: any): Promise<any> {
  const quotationTemplateId  = fullQuotation?.pdf_template_id
  const opportunityTemplateId = fullQuotation?.opportunity?.default_pdf_template_id

  if (quotationTemplateId) {
    const template = await getTemplateByIdPromise(quotationTemplateId)
    if (template?.blocks?.length) return template
  }
  if (opportunityTemplateId) {
    const template = await getTemplateByIdPromise(opportunityTemplateId)
    if (template?.blocks?.length) return template
  }
  return getWorkspaceDefaultPromise()
}

function getQuotationPromise(id: number) {
  if (!quotationCache.has(id)) {
    const p = quotationService.getByIdForPDF(id)
    p.catch(() => quotationCache.delete(id))
    quotationCache.set(id, p)
  }
  return quotationCache.get(id)!
}

function getBlobPromise(id: number): Promise<Blob> {
  if (!blobCache.has(id)) {
    console.log(`[pdf] start blob render id=${id}`)
    const t0 = performance.now()
    const p = buildBlob(id).then((blob) => {
      console.log(`[pdf] blob ready id=${id} → ${(performance.now() - t0).toFixed(0)}ms (~${Math.round(blob.size / 1024)} KB)`)
      return blob
    })
    p.catch(() => blobCache.delete(id))
    blobCache.set(id, p)
  }
  return blobCache.get(id)!
}

/**
 * Call when the actions dropdown opens.
 * Pre-fetches quotation data + template + renders the PDF blob — all in background.
 * By the time user opens the send sheet, the PDF is ready.
 */
export function warmPdfCache(id: number): void {
  getWorkspaceDefaultPromise()
  getQuotationPromise(id)
  getBlobPromise(id)
}

/** Call when a quotation is edited so the next PDF fetch gets fresh data. */
export function clearPdfCache(id: number): void {
  quotationCache.delete(id)
  blobCache.delete(id)
}

/** Blob del PDF real de una cotización — usado por el sheet de "Vista previa". Comparte caché con descarga/envío. */
export function getQuotationPdfBlob(id: number): Promise<Blob> {
  return getBlobPromise(id)
}

/**
 * Call when the default template of an opportunity changes — afecta a todas las
 * cotizaciones de esa oportunidad que no tengan su propio override, no solo a una.
 */
export function clearAllPdfCache(): void {
  quotationCache.clear()
  blobCache.clear()
}

// ─── Shared blob builder ──────────────────────────────────────────────────────

async function buildBlob(quotationId: number): Promise<Blob> {
  const fullQuotation = await getQuotationPromise(quotationId)
  const template = await resolveTemplateForQuotation(fullQuotation)

  const resolvedBlocks: ResolvedTemplateBlock[] = template?.blocks
    ? template.blocks
        .sort((a: any, b: any) => a.order - b.order)
        .map((block: any) => ({
          title:         block.title,
          position:      block.position,
          order:         block.order,
          parsedContent: parseHtmlToBlocks(resolveTemplateVariables(block.content, fullQuotation)),
        }))
    : []

  return pdf(
    <QuotationPDF quotation={fullQuotation} resolvedBlocks={resolvedBlocks} />,
  ).toBlob()
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Genera el PDF como base64 (sin descargarlo). Usado por el envío de correo. */
export async function generatePdfBase64(quotationId: number): Promise<string> {
  const wasWarmed = blobCache.has(quotationId)
  const t0 = performance.now()
  const blob = await getBlobPromise(quotationId)
  console.log(`[pdf] generatePdfBase64 ${wasWarmed ? "(pre-warmed ✓)" : "(cold build)"} → ${(performance.now() - t0).toFixed(0)}ms`)
  return blobToBase64(blob)
}

export async function downloadQuotationPdf(quotationId: number, quotationName: string): Promise<void> {
  const t0 = performance.now()
  notify.info({ title: "Generando PDF…", description: `Preparando "${quotationName}".` })

  const wasWarmed = blobCache.has(quotationId)
  const blob = await getBlobPromise(quotationId)
  console.log(`[pdf] download ${wasWarmed ? "(pre-warmed ✓)" : "(cold build)"} → ${(performance.now() - t0).toFixed(0)}ms`)

  const fileName = `cotizacion-${quotationId}-${quotationName}.pdf`
  const url  = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href     = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)

  notify.success({ title: "PDF listo", description: `"${quotationName}" se descargó correctamente.` })

  quotationCache.delete(quotationId)
  blobCache.delete(quotationId)
  quotationHistoryService.logPdfDownloaded(quotationId, fileName).catch(() => {})
}
