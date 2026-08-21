import type { ReactNode } from "react"
import {
  BotIcon,
  CalendarIcon,
  GlobeIcon,
  MailIcon,
  MegaphoneIcon,
  MessageSquareTextIcon,
  PhoneIcon,
  StarIcon,
  TagIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react"
import { FaLinkedin } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { SiFacebook, SiInstagram, SiWhatsapp } from "react-icons/si"
import { Badge } from "@/components/ui/badge"
import { SOURCE_LABEL } from "@/lib/table-utils"
import { cn } from "@/lib/utils"

// El pill (fondo/borde/texto) es siempre indigo — eso es lo que identifica la
// categoría "Fuente" en toda la app, con variante dark: propia. Evita el
// problema de los badges de estado (Funnels, Quotations, Activities) con
// colores sueltos sin dark: que se ven mal en modo oscuro. El ícono, en
// cambio, sí lleva su propio color por familia (ver SOURCE_ICON más abajo).
const SOURCE_BADGE_CLASS =
  "gap-1 border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300"

// Color fijo por ícono (sin variante dark:, igual que WhatsApp/Google) — se ve
// bien en ambos temas porque son tonos saturados de marca o de categoría, no
// pasteles. Agrupados por familia para que sea reconocible de un vistazo, no
// un color distinto por cada valor:
//   marca (redes/mensajería) · IA · interacción humana · marketing · digital
// Manual/Sistema/Importado quedan sin color propio a propósito — son
// categorías técnicas, no canales, así que heredan el indigo del badge.
const IA_COLOR = "#7C3AED" // mismo violeta que Widget IA en Mensajería (ChannelBadge)
const HUMANO_COLOR = "#F59E0B"
const MARKETING_COLOR = "#EC4899"
const DIGITAL_COLOR = "#0EA5E9"

const SOURCE_ICON: Record<string, ReactNode> = {
  linkedin: <FaLinkedin className="text-[#0A66C2]" />,
  whatsapp: <SiWhatsapp className="text-[#25D366]" />,
  facebook: <SiFacebook className="text-[#1877F2]" />,
  instagram: <SiInstagram className="text-[#E4405F]" />,
  email: <MailIcon style={{ color: DIGITAL_COLOR }} />,
  referral: <StarIcon style={{ color: HUMANO_COLOR }} />,
  phone_call: <PhoneIcon style={{ color: HUMANO_COLOR }} />,
  inbound_call: <PhoneIcon style={{ color: HUMANO_COLOR }} />,
  website: <GlobeIcon style={{ color: DIGITAL_COLOR }} />,
  event: <CalendarIcon style={{ color: HUMANO_COLOR }} />,
  online_ads: <MegaphoneIcon style={{ color: MARKETING_COLOR }} />,
  cold_outreach: <MegaphoneIcon style={{ color: MARKETING_COLOR }} />,
}

interface SourceMeta {
  label: string
  icon: ReactNode
}

// Prioridad: legado CAMIONGO (importación masiva histórica) > Google Contactos
// (ícono de marca, es la excepción a "todo monocromo") > contact_source
// conocido > origin (widget/CRM manual/sistema/agente) > lo que quede, tal cual.
export function getSourceMeta(contactSource: string | null, origin: string): SourceMeta {
  if (origin === "CAMIONGO") return { label: "Importado", icon: <UploadIcon /> }
  if (contactSource === "google_contacts") return { label: "Google", icon: <FcGoogle /> }
  if (contactSource === "Importación masiva") return { label: "Importación masiva", icon: <UploadIcon /> }
  if (contactSource) {
    return { label: SOURCE_LABEL[contactSource] ?? contactSource, icon: SOURCE_ICON[contactSource] ?? <TagIcon /> }
  }
  if (origin === "widget") return { label: "Widget IA", icon: <MessageSquareTextIcon style={{ color: IA_COLOR }} /> }
  if (origin === "CRM") return { label: "Manual", icon: <UserIcon /> }
  if (origin === "SYSTEM_USER" || origin === "SYSTEM_WORKSPACE") return { label: "Sistema", icon: <UserIcon /> }
  if (origin === "AGENT") return { label: "Agente IA", icon: <BotIcon style={{ color: IA_COLOR }} /> }
  return { label: origin, icon: <TagIcon /> }
}

interface SourceBadgeProps {
  contactSource: string | null
  origin: string
  className?: string
}

export function SourceBadge({ contactSource, origin, className }: SourceBadgeProps) {
  const { label, icon } = getSourceMeta(contactSource, origin)
  return (
    <Badge variant="outline" className={cn(SOURCE_BADGE_CLASS, className)}>
      {icon}
      {label}
    </Badge>
  )
}
