import api from "@/lib/api"
import type { RealCalendarDraft, RealEmailDraft, SuggestionGroup } from "@/components/dashboard/funnels/suggestions/types"

export const opportunitySuggestionService = {
  async list(): Promise<SuggestionGroup[]> {
    const res = await api.get<never, { suggestions: SuggestionGroup[] }>("opportunity-suggestions")
    return res.suggestions
  },

  // La acción real (enviar correo, crear evento, marcar ganada/perdida, completar
  // actividad) se ejecuta antes, contra el servicio real correspondiente — esto solo
  // cierra la sugerencia del lado de `opportunity_suggestion`.
  async apply(suggestionId: number): Promise<void> {
    await api.put(`opportunity-suggestions/${suggestionId}/apply`)
  },

  async dismiss(suggestionId: number): Promise<void> {
    await api.put(`opportunity-suggestions/${suggestionId}/dismiss`)
  },

  async regenerate(suggestionId: number, context: string): Promise<RealEmailDraft | RealCalendarDraft> {
    const res = await api.put<never, { draft: RealEmailDraft | RealCalendarDraft }>(
      `opportunity-suggestions/${suggestionId}/regenerate`,
      { context }
    )
    return res.draft
  },
}
