import api from "@/lib/api"

export const aiAudioService = {
  async transcribe(audioBase64: string): Promise<string> {
    const res = await api.post<never, { success: boolean; data: { text: string } }>(
      "ai/audio/transcribe",
      { audio: audioBase64 }
    )
    return res.data.text
  },
}
