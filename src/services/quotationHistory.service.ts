import api from "@/lib/api"
import type { QuotationHistoryPage } from "@/types/quotationHistory"

const LIMIT = 25

export const quotationHistoryService = {
  async getByQuotation(
    quotationId: number,
    options: { limit?: number; offset?: number } = {},
  ): Promise<QuotationHistoryPage> {
    const { limit = LIMIT, offset = 0 } = options
    const res = await api.get<never, { data: QuotationHistoryPage }>(
      `quotation/${quotationId}/history`,
      { params: { limit, offset, orderBy: "desc" } },
    )
    return res.data
  },

  async logPdfDownloaded(quotationId: number, fileName: string): Promise<void> {
    await api.post(`quotation/${quotationId}/history/pdf-downloaded`, { fileName })
  },
}
