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

// Monedas cuyo símbolo/código no es un peso — necesitan decimales (ej. UF, cuyo valor
// se cotiza como "1,5 UF"). El resto del sistema (CLP, USD, etc.) sigue en enteros,
// igual que siempre. `currency` acá es el símbolo tal cual lo definió el workspace
// (no hay un campo "code" separado en la tabla currency), por eso se compara así.
export function getCurrencyDecimals(currency: string): number {
  return currency?.trim().toUpperCase() === "UF" ? 2 : 0
}

// Formatea dígitos crudos con separador de miles, sin símbolo — para mostrar dentro de un input.
export function formatNumber(raw: string, currency: string): string {
  if (!raw) return ""
  const num = parseFloat(raw)
  if (isNaN(num)) return ""
  const locale = CURRENCY_LOCALE[currency] ?? "es-CL"
  const decimals = getCurrencyDecimals(currency)
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(num)
}

// Formatea un monto ya calculado con símbolo — para texto de solo lectura (Total, Resumen).
export function formatMoney(amount: number, currency: string): string {
  const locale = CURRENCY_LOCALE[currency] ?? "es-CL"
  const symbol = CURRENCY_SYMBOL[currency] ?? currency
  const decimals = getCurrencyDecimals(currency)
  const n = new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(amount)
  return `${symbol}${n}`
}
