export const PHONE_CODES: { value: string; label: string }[] = [
  { value: "+56",  label: "+56"  }, // CL
  { value: "+54",  label: "+54"  }, // AR
  { value: "+55",  label: "+55"  }, // BR
  { value: "+52",  label: "+52"  }, // MX
  { value: "+57",  label: "+57"  }, // CO
  { value: "+51",  label: "+51"  }, // PE
  { value: "+598", label: "+598" }, // UY
  { value: "+595", label: "+595" }, // PY
  { value: "+591", label: "+591" }, // BO
  { value: "+593", label: "+593" }, // EC
  { value: "+58",  label: "+58"  }, // VE
  { value: "+506", label: "+506" }, // CR
  { value: "+507", label: "+507" }, // PA
  { value: "+502", label: "+502" }, // GT
  { value: "+504", label: "+504" }, // HN
  { value: "+503", label: "+503" }, // SV
  { value: "+505", label: "+505" }, // NI
  { value: "+53",  label: "+53"  }, // CU
  { value: "+1",   label: "+1"   }, // US/CA/DO/PR
  { value: "+34",  label: "+34"  }, // ES
  { value: "+351", label: "+351" }, // PT
  { value: "+44",  label: "+44"  }, // GB
  { value: "+49",  label: "+49"  }, // DE
  { value: "+33",  label: "+33"  }, // FR
  { value: "+39",  label: "+39"  }, // IT
  { value: "+31",  label: "+31"  }, // NL
  { value: "+32",  label: "+32"  }, // BE
  { value: "+41",  label: "+41"  }, // CH
  { value: "+43",  label: "+43"  }, // AT
  { value: "+46",  label: "+46"  }, // SE
  { value: "+47",  label: "+47"  }, // NO
  { value: "+45",  label: "+45"  }, // DK
  { value: "+358", label: "+358" }, // FI
  { value: "+48",  label: "+48"  }, // PL
  { value: "+7",   label: "+7"   }, // RU
  { value: "+380", label: "+380" }, // UA
  { value: "+40",  label: "+40"  }, // RO
  { value: "+61",  label: "+61"  }, // AU
  { value: "+64",  label: "+64"  }, // NZ
  { value: "+81",  label: "+81"  }, // JP
  { value: "+91",  label: "+91"  }, // IN
  { value: "+27",  label: "+27"  }, // ZA
]

export const COUNTRY_DIAL_CODE: Record<string, string> = {
  CL: "+56",  AR: "+54",  BR: "+55",  MX: "+52",  CO: "+57",
  PE: "+51",  UY: "+598", PY: "+595", BO: "+591", EC: "+593",
  VE: "+58",  CR: "+506", PA: "+507", DO: "+1",   GT: "+502",
  HN: "+504", SV: "+503", NI: "+505", CU: "+53",  PR: "+1",
  ES: "+34",  PT: "+351", GB: "+44",  DE: "+49",  FR: "+33",
  IT: "+39",  NL: "+31",  BE: "+32",  CH: "+41",  AT: "+43",
  SE: "+46",  NO: "+47",  DK: "+45",  FI: "+358", PL: "+48",
  RU: "+7",   UA: "+380", RO: "+40",  US: "+1",   CA: "+1",
  AU: "+61",  NZ: "+64",  JP: "+81",  IN: "+91",  ZA: "+27",
}

// Separa un teléfono guardado como "+56 91234567" en código + número.
// Si no matchea ningún código conocido, usa fallbackCode y deja el string completo como número.
export function splitPhone(full: string | null | undefined, fallbackCode: string): { code: string; number: string } {
  const trimmed = (full ?? "").trim()
  if (!trimmed) return { code: fallbackCode, number: "" }
  const sorted = [...PHONE_CODES].sort((a, b) => b.value.length - a.value.length)
  const match = sorted.find((c) => trimmed.startsWith(c.value))
  if (match) {
    return { code: match.value, number: trimmed.slice(match.value.length).trim() }
  }
  return { code: fallbackCode, number: trimmed }
}
