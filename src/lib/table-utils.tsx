import { ArrowDownIcon, ArrowUpDown, ArrowUpIcon } from "lucide-react"

export const getFlag = (code: string) =>
  code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("")

export const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return <ArrowUpIcon className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

export const SOURCE_LABEL: Record<string, string> = {
  linkedin:         "LinkedIn",
  whatsapp:         "WhatsApp",
  email:            "Correo",
  referral:         "Referido",
  phone_call:       "Llamada Telefónica",
  website:          "Sitio Web/Formulario",
  instagram:        "Instagram",
  facebook:         "Facebook",
  event:            "Evento/Feria",
  online_ads:       "Publicidad Online",
  partner:          "Partner/Intermediario",
  inbound_call:     "Llamada Entrante",
  cold_outreach:    "Prospección en Frío",
  google_contacts:  "Google",
}

// Color compartido para "esto venció y sigue sin resolverse" — Actividades
// (Atrasada) y Cotizaciones (Vencida) usan el mismo tono para que la app
// tenga un único lenguaje visual para esta alerta, no uno por tabla.
export const OVERDUE_BADGE_CLASS =
  "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300"

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

// Paleta categórica validada por la skill dataviz (contraste + daltonismo, light/dark)
// + un 9no tono (ciruela) que pasa las mismas pruebas.
const ACCENT_SWATCHES = [
  "bg-[#2a78d6] dark:bg-[#3987e5]",
  "bg-[#eb6834] dark:bg-[#d95926]",
  "bg-[#1baf7a] dark:bg-[#199e70]",
  "bg-[#eda100] dark:bg-[#c98500]",
  "bg-[#e87ba4] dark:bg-[#d55181]",
  "bg-[#008300] dark:bg-[#008300]",
  "bg-[#4a3aa7] dark:bg-[#9085e9]",
  "bg-[#e34948] dark:bg-[#e66767]",
  "bg-[#994caa] dark:bg-[#a75fb7]",
] as const

// Determinístico: mismo seed (usar el id de la entidad, no el nombre, para que no
// cambie si la renombran) siempre da el mismo color, sin guardar nada en la BD.
export function getAccentClass(seed: number) {
  const n = ACCENT_SWATCHES.length
  return ACCENT_SWATCHES[((seed % n) + n) % n]
}
