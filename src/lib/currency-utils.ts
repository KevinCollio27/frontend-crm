// Mapea el código de moneda (ISO 4217) al código de país (ISO 3166-1 alpha-2)
// usado por SearchableSelect para renderizar la bandera vía flagcdn.com
export const CURRENCY_FLAG: Record<string, string> = {
  CLP: "cl",
  USD: "us",
  ARS: "ar",
  COP: "co",
  MXN: "mx",
  PEN: "pe",
  BRL: "br",
  EUR: "eu",
}
