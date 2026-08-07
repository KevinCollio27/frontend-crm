// Soft launch — Sugerencias IA. Espejo del allowlist real en el backend
// (aiSuggestions.config.ts) — acá solo se usa para UX (mostrar el mensaje
// correcto antes de intentar activar), la restricción real la aplica el
// backend en /integration/connect/ai-suggestions. Sacar cuando se abra a todos.
export const AI_SUGGESTIONS_ALLOWED_WORKSPACE_IDS = [
  7,  // GOXT
  6,  // CamiónGO
  5,  // Southway
  41, // PROHABLA: Feria de Empleo EXPOTALENTO
]
