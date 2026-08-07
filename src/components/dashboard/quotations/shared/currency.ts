export const CURRENCIES = [
  { value: "CLP", label: "CLP", flag: "cl" },
  { value: "USD", label: "USD", flag: "us" },
  { value: "ARS", label: "ARS", flag: "ar" },
  { value: "COP", label: "COP", flag: "co" },
  { value: "MXN", label: "MXN", flag: "mx" },
]

export const CURRENCY_LOCALE: Record<string, string> = {
  CLP: "es-CL",
  USD: "en-US",
  ARS: "es-AR",
  COP: "es-CO",
  MXN: "es-MX",
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  CLP: "$",
  USD: "$",
  ARS: "$",
  COP: "$",
  MXN: "$",
}

// Formatea dígitos crudos con separador de miles, sin símbolo — para mostrar dentro de un input.
export function formatNumber(raw: string, currency: string): string {
  if (!raw) return ""
  const num = parseInt(raw, 10)
  if (isNaN(num)) return ""
  const locale = CURRENCY_LOCALE[currency] ?? "es-CL"
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(num)
}

// Formatea un monto ya calculado con símbolo — para texto de solo lectura (Total, Resumen).
export function formatMoney(amount: number, currency: string): string {
  const locale = CURRENCY_LOCALE[currency] ?? "es-CL"
  const symbol = CURRENCY_SYMBOL[currency] ?? "$"
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(amount))
  return `${symbol}${n}`
}
