import api from "@/lib/api"
import type { FileReport } from "@/types/fileReport"

export const fileReportService = {
  async list(): Promise<FileReport[]> {
    const res = await api.get<never, { fileReports: FileReport[] }>("file-report")
    return res.fileReports
  },

  async getUrl(fileReportId: number): Promise<string> {
    const res = await api.post<never, { url: string }>("file-report/url", { file_report_id: fileReportId })
    return res.url
  },
}
