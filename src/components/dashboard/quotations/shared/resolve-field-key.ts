interface LabelKeyLookup {
  key: string
  name: string
}

// El frontend anterior guardaba field_key = nombre de la etiqueta (no su key), y el
// backend además sobreescribía la key de etiquetas Cargo a un valor fijo por tipo antes
// de que se corrigiera. Para leer cotizaciones creadas con ese esquema viejo bajo el
// esquema nuevo (que indexa todo por label.key), se intenta matchear primero por key
// (dato ya correcto) y si no hay coincidencia, por name (dato del frontend anterior) —
// siempre devolviendo la key canónica actual de la etiqueta.
export function resolveFieldKey(rawFieldKey: string, labels: LabelKeyLookup[]): string {
  const byKey = labels.find((l) => l.key === rawFieldKey)
  if (byKey) return byKey.key
  const byName = labels.find((l) => l.name === rawFieldKey)
  if (byName) return byName.key
  return rawFieldKey
}
