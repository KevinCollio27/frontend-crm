import { timingSafeEqual } from "node:crypto"
import { renderToBuffer } from "@react-pdf/renderer"
import QuotationPDF from "@/components/dashboard/quotations/QuotationPDF"
import { resolveTemplateVariables } from "@/lib/htmlToBlocks"
import { parseHtmlToBlocksServer } from "@/lib/htmlToBlocks.server"
import type { PdfTemplateBlock, ResolvedTemplateBlock } from "@/types/pdfTemplate"

// Genera el PDF de una cotización con el mismo componente que usa el navegador
// (download-pdf.tsx), para que el backend pueda adjuntarlo a un correo sin que haya
// un usuario con el CRM abierto. Solo lo llama el backend: no lleva sesión, sino un
// secreto compartido, y recibe los datos ya cargados en vez de ir a buscarlos.

function isAuthorized(request: Request): boolean {
  const expected = process.env.INTERNAL_API_SECRET
  const received = request.headers.get("x-internal-secret")
  if (!expected || !received) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return Response.json({ message: "No autorizado." }, { status: 401 })

  const { quotation, template } = (await request.json()) as {
    quotation: { id: number } & Record<string, unknown>
    template: { blocks?: PdfTemplateBlock[] } | null
  }
  if (!quotation?.id) return Response.json({ message: "Falta la cotización." }, { status: 400 })

  const resolvedBlocks: ResolvedTemplateBlock[] = [...(template?.blocks ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((block) => ({
      title: block.title,
      position: block.position,
      order: block.order,
      parsedContent: parseHtmlToBlocksServer(resolveTemplateVariables(block.content, quotation)),
    }))

  const pdf = await renderToBuffer(<QuotationPDF quotation={quotation} resolvedBlocks={resolvedBlocks} />)

  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf" } })
}
