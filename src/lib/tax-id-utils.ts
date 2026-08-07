type FormatFn = (raw: string) => string

export const TAX_ID_FORMATTERS: Partial<Record<string, FormatFn>> = {
  CL: (raw) => {
    const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9)
    if (clean.length < 2) return clean
    const verifier = clean.slice(-1)
    const body = clean.slice(0, -1)
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${verifier}`
  },
  UY: (raw) => {
    const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9)
    if (clean.length < 2) return clean
    const verifier = clean.slice(-1)
    const body = clean.slice(0, -1)
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${verifier}`
  },
  AR: (raw) => {
    const clean = raw.replace(/\D/g, "").slice(0, 11)
    if (clean.length <= 2) return clean
    if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2)}`
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
  },
  BR: (raw) => {
    const clean = raw.replace(/\D/g, "").slice(0, 14)
    if (clean.length <= 2) return clean
    if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`
    if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`
    if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
  },
  CO: (raw) => {
    const clean = raw.replace(/\D/g, "").slice(0, 10)
    if (clean.length <= 3) return clean
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
  },
}

export function formatTaxId(country: string, raw: string): string {
  return TAX_ID_FORMATTERS[country]?.(raw) ?? raw
}

export const TAX_ID_META: Record<string, { label: string; placeholder: string }> = {
  AR: { label: "CUIT",             placeholder: "Ej. 20-12345678-9" },
  BO: { label: "NIT",              placeholder: "Ej. 123456789" },
  BR: { label: "CNPJ",             placeholder: "Ej. 11.222.333/0001-81" },
  CA: { label: "BN",               placeholder: "Ej. 123456789 RT0001" },
  CL: { label: "RUT",              placeholder: "Ej. 76.123.456-7" },
  CO: { label: "NIT",              placeholder: "Ej. 900.123.456-7" },
  CR: { label: "Cédula Jurídica",  placeholder: "Ej. 3-101-123456" },
  DE: { label: "Steuernummer",     placeholder: "Ej. 12/345/67890" },
  EC: { label: "RUC",              placeholder: "Ej. 1234567890001" },
  ES: { label: "CIF / NIF",        placeholder: "Ej. B12345678" },
  MX: { label: "RFC",              placeholder: "Ej. ABC-123456-XXX" },
  PA: { label: "RUC",              placeholder: "Ej. 12-345-67890" },
  PE: { label: "RUC",              placeholder: "Ej. 20123456789" },
  PY: { label: "RUC",              placeholder: "Ej. 80012345-6" },
  UY: { label: "RUT",              placeholder: "Ej. 21 234567 8" },
  US: { label: "EIN",              placeholder: "Ej. 12-3456789" },
  VE: { label: "RIF",              placeholder: "Ej. J-12345678-9" },
}

export const DEFAULT_TAX_ID = { label: "ID Fiscal", placeholder: "Ej. 123456789" }
