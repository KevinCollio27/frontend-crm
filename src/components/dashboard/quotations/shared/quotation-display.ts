import { isCargoLabelType, parseCargoValue } from "./cargo-labels"

// Texto legible para mostrar un valor de fila en modo solo-lectura (Vista Previa, etc.).
// Los tipos cargo_* guardan un JSON {tipo_id, tipo_name, ...} — acá se extrae solo el nombre.
export function displayFieldValue(rawValue: string, type: string): string {
  if (!rawValue) return "—"
  if (isCargoLabelType(type)) {
    const parsed = parseCargoValue(rawValue, type)
    return parsed?.name || "—"
  }
  if (type === "boolean") return rawValue === "true" ? "Sí" : "No"
  return rawValue
}
