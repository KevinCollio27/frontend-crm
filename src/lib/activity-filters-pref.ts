// Filtros de Actividades guardados por usuario y por workspace (mismo criterio que
// workspace-pref.ts). Es donde el equipo lleva el día a día: cada persona deja su vista
// ("solo las mías", "todo el equipo") y la recupera al volver del detalle, al cambiar de
// sección o al otro día. La búsqueda por texto no se guarda: es una consulta puntual.

export interface ActivityFiltersPref {
  view?: "lista" | "board"
  flowId?: number | null
  opportunityId?: number | null
  status?: string
  types?: string[]
  priorities?: string[]
  responsibles?: string[]
}

const key = (userId: number, workspaceId: number) => `activity_filters_${userId}_${workspaceId}`

export function loadActivityFilters(userId: number, workspaceId: number): ActivityFiltersPref | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key(userId, workspaceId))
    return raw ? (JSON.parse(raw) as ActivityFiltersPref) : null
  } catch {
    return null
  }
}

export function saveActivityFilters(userId: number, workspaceId: number, pref: ActivityFiltersPref): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key(userId, workspaceId), JSON.stringify(pref))
  } catch {
    // modo privado / cuota llena: los filtros simplemente no se recuerdan
  }
}
