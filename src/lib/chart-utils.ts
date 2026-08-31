// Paso "lindo" para el eje Y de un chart de barras/líneas (1/2/5 × una potencia de 10) —
// apunta a ~5 marcas sea el máximo 11 o 920. Compartido entre FunnelPipelineChart y
// NewOpportunitiesChart (mismo problema: un tope fijo se rompe con valores grandes).
export function niceStep(maxValue: number, targetTicks = 5): number {
  if (maxValue <= 0) return 1
  const roughStep = maxValue / targetTicks
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return niceNormalized * magnitude
}
