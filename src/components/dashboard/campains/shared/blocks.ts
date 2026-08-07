export type Align = "left" | "center" | "right" | "justify"

export interface TextStyleData {
  text: string
  align: Align
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
  backgroundColor: string
  font: string
  href: string
}

export interface HeadingBlockData extends TextStyleData {
  level: "h1" | "h2" | "h3"
}

export type TextBlockData = TextStyleData

export interface ButtonBlockData {
  label: string
  href: string
  color: string
  textColor: string
  radius: number
  align: "left" | "center" | "right"
}

export interface ImageBlockData {
  src: string
  alt: string
  width: string
  href: string
}

export interface DividerBlockData {
  color: string
}

export interface SpacerBlockData {
  height: number
}

export interface SocialBlockData {
  facebook: string
  instagram: string
  linkedin: string
  twitter: string
}

export interface FooterBlockData {
  companyName: string
  address: string
  unsubscribeText: string
}

export interface ImageTextBlockData {
  src: string
  alt: string
  title: string
  text: string
  imagePosition: "left" | "right"
  textAlign: "left" | "center" | "right"
}

export interface HighlightBlockData {
  label: string
  message: string
  code: string
  accentColor: string
}

export interface SignatureBlockData {
  logoSrc: string
  logoWidth: string
  logoMaxHeight: string
  name: string
  role: string
  phone: string
  email: string
  website: string
}

export interface HeroBlockData {
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  bg: string
  fg: string
}

export interface ColumnsBlockData {
  columns: string[]
}

export interface ListBlockData {
  items: string[]
  style: "bullet" | "number"
}

export interface QuoteBlockData {
  text: string
  author: string
}

export interface VideoBlockData {
  href: string
  thumbnail: string
  caption: string
}

export type CampaignBlock =
  | { id: string; type: "heading"; data: HeadingBlockData }
  | { id: string; type: "text"; data: TextBlockData }
  | { id: string; type: "button"; data: ButtonBlockData }
  | { id: string; type: "image"; data: ImageBlockData }
  | { id: string; type: "divider"; data: DividerBlockData }
  | { id: string; type: "spacer"; data: SpacerBlockData }
  | { id: string; type: "social"; data: SocialBlockData }
  | { id: string; type: "footer"; data: FooterBlockData }
  | { id: string; type: "imageText"; data: ImageTextBlockData }
  | { id: string; type: "highlight"; data: HighlightBlockData }
  | { id: string; type: "signature"; data: SignatureBlockData }
  | { id: string; type: "hero"; data: HeroBlockData }
  | { id: string; type: "columns"; data: ColumnsBlockData }
  | { id: string; type: "list"; data: ListBlockData }
  | { id: string; type: "quote"; data: QuoteBlockData }
  | { id: string; type: "video"; data: VideoBlockData }

export type BlockType = CampaignBlock["type"]

export const FONT_OPTIONS = [
  { value: "inherit", label: "Por defecto" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
]

function emptyTextStyle(text: string, bold: boolean, color: string): TextStyleData {
  return { text, align: "left", bold, italic: false, underline: false, color, backgroundColor: "", font: "inherit", href: "" }
}

export function emptyBlock(type: BlockType): CampaignBlock {
  const id = crypto.randomUUID()
  switch (type) {
    case "heading":
      return { id, type, data: { ...emptyTextStyle("Título principal", true, "#111111"), level: "h1" } }
    case "text":
      return { id, type, data: emptyTextStyle("Escribe aquí el contenido de tu mensaje.", false, "#374151") }
    case "button":
      return { id, type, data: { label: "Botón", href: "", color: "#111111", textColor: "#ffffff", radius: 6, align: "center" } }
    case "image":
      return { id, type, data: { src: "", alt: "", width: "100%", href: "" } }
    case "divider":
      return { id, type, data: { color: "#e5e7eb" } }
    case "spacer":
      return { id, type, data: { height: 24 } }
    case "social":
      return { id, type, data: { facebook: "", instagram: "", linkedin: "", twitter: "" } }
    case "footer":
      return {
        id,
        type,
        data: {
          companyName: "Mi Empresa",
          address: "Av. Siempre Viva 123, Santiago",
          unsubscribeText: "¿No deseas recibir más correos? Date de baja",
        },
      }
    case "imageText":
      return {
        id,
        type,
        data: { src: "", alt: "", title: "Título", text: "Describe tu producto o servicio aquí.", imagePosition: "left", textAlign: "left" },
      }
    case "highlight":
      return {
        id,
        type,
        data: {
          label: "OFERTA ESPECIAL",
          message: "15% de descuento en tu próximo viaje",
          code: "CÓDIGO: PROMO15",
          accentColor: "#6366f1",
        },
      }
    case "signature":
      return {
        id,
        type,
        data: { logoSrc: "", logoWidth: "100px", logoMaxHeight: "48px", name: "Nombre Apellido", role: "Cargo", phone: "", email: "", website: "" },
      }
    case "hero":
      return {
        id,
        type,
        data: {
          title: "Hola {{nombre}} 👋",
          subtitle: "Una oferta pensada para ti",
          ctaLabel: "Descubrir",
          ctaHref: "",
          bg: "#0f172a",
          fg: "#ffffff",
        },
      }
    case "columns":
      return { id, type, data: { columns: ["", ""] } }
    case "list":
      return { id, type, data: { items: ["Primer punto", "Segundo punto", "Tercer punto"], style: "bullet" } }
    case "quote":
      return { id, type, data: { text: "Una cita inspiradora puede ir aquí.", author: "Nombre Apellido" } }
    case "video":
      return { id, type, data: { href: "", thumbnail: "", caption: "" } }
  }
}
