// Convención de `id` (igual que Catálogos/Productos): el id numérico real (como string) si la
// etapa ya existe en el backend, o `temp-<uuid>` si es nueva — así el submit de edición sabe
// qué crear, actualizar o eliminar sin comparar por contenido.
export interface FunnelStage {
  id: string
  name: string
}

export interface FunnelFormState {
  id?: number
  name: string
  isDefault: boolean
  stages: FunnelStage[]
}

export function createEmptyFunnelForm(): FunnelFormState {
  return {
    name: "",
    isDefault: false,
    stages: [],
  }
}

export function isNewId(id: string): boolean {
  return id.startsWith("temp-")
}
