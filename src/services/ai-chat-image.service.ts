import api from "@/lib/api"

export interface ChatImageUploadResult {
  url: string
  filePath: string
  fileName: string
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const aiChatImageService = {
  async upload(file: File): Promise<ChatImageUploadResult> {
    const image = await fileToDataUrl(file)
    const res = await api.post<never, { success: boolean; data: ChatImageUploadResult }>(
      "ai/chat/upload-image",
      { image, mimeType: file.type }
    )
    return res.data
  },
}
