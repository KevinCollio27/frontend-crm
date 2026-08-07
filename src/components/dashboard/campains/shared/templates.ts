import type { CampaignBlock } from "./blocks"

export interface CampaignTemplate {
  id: string
  name: string
  description: string
  blockCount: number
  makeBlocks: () => CampaignBlock[]
}

function id() { return crypto.randomUUID() }

function txt(text: string, color = "#374151", align: "left" | "center" | "right" = "left"): CampaignBlock {
  return {
    id: id(),
    type: "text",
    data: { text, align, bold: false, italic: false, underline: false, color, backgroundColor: "", font: "inherit", href: "" },
  }
}

function h2(text: string): CampaignBlock {
  return {
    id: id(),
    type: "heading",
    data: { text, level: "h2", align: "left", bold: true, italic: false, underline: false, color: "#111111", backgroundColor: "", font: "inherit", href: "" },
  }
}

function btn(label: string, color = "#111111"): CampaignBlock {
  return {
    id: id(),
    type: "button",
    data: { label, href: "", color, textColor: "#ffffff", radius: 6, align: "center" },
  }
}

function footer(): CampaignBlock {
  return {
    id: id(),
    type: "footer",
    data: {
      companyName: "{{empresa}}",
      address: "",
      unsubscribeText: "¿No deseas recibir más correos? Puedes darte de baja respondiendo este correo.",
    },
  }
}

function img(src: string, alt = ""): CampaignBlock {
  return { id: id(), type: "image", data: { src, alt, width: "100%", href: "" } }
}

function imgTxt(src: string, title: string, text: string): CampaignBlock {
  return {
    id: id(),
    type: "imageText",
    data: { src, alt: title, title, text, imagePosition: "left", textAlign: "left" },
  }
}

function divider(): CampaignBlock {
  return { id: id(), type: "divider", data: { color: "#e5e7eb" } }
}

function signature(): CampaignBlock {
  return {
    id: id(),
    type: "signature",
    data: { logoSrc: "", logoWidth: "100px", logoMaxHeight: "48px", name: "Equipo {{empresa}}", role: "", phone: "", email: "", website: "" },
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "blank",
    name: "En blanco",
    description: "Canvas vacío, empieza desde cero.",
    blockCount: 1,
    makeBlocks: () => [footer()],
  },
  {
    id: "bienvenida",
    name: "Bienvenida",
    description: "Para recibir a un nuevo cliente o contacto.",
    blockCount: 5,
    makeBlocks: () => [
      {
        id: id(),
        type: "hero",
        data: {
          title: "¡Bienvenido, {{nombre}}! 👋",
          subtitle: "Estamos muy contentos de que estés aquí.",
          ctaLabel: "",
          ctaHref: "",
          bg: "#0f172a",
          fg: "#ffffff",
        },
      },
      txt(
        "Hola {{nombre}},\n\nEn {{empresa}} estamos muy contentos de tenerte con nosotros. Queremos acompañarte en cada paso y asegurarnos de que tengas la mejor experiencia posible.\n\nSi tienes cualquier duda, estamos aquí para ayudarte.",
      ),
      img("https://goxt.io/_next/image?url=%2Fassets%2Fbento%2FEmpresas.jpg&w=1080&q=75", "Imagen de presentación"),
      btn("Comenzar"),
      footer(),
    ],
  },
  {
    id: "captacion",
    name: "Captación",
    description: "Para llegar a un lead frío por primera vez.",
    blockCount: 6,
    makeBlocks: () => [
      h2("Hola {{nombre}}, te escribimos desde {{empresa}}"),
      txt(
        "Sabemos que tu tiempo es valioso, así que iremos directo al punto.\n\nTraemos una propuesta que creemos puede ser relevante para ti y tu organización. ¿Tienes 20 minutos para contarnos más?",
      ),
      imgTxt(
        "https://goxt.io/_next/image?url=%2Fassets%2Fbento%2FEmpresas.jpg&w=1080&q=75",
        "Lo que ofrecemos",
        "Describe aquí tu propuesta de valor principal. Qué hace tu empresa, cómo ayuda y por qué debería importarle a {{nombre}}.",
      ),
      btn("Agendar una reunión"),
      txt(
        "¿Prefieres otro medio? Puedes responder este correo y nos pondremos en contacto contigo a la brevedad.",
        "#6b7280",
        "center",
      ),
      footer(),
    ],
  },
  {
    id: "seguimiento",
    name: "Seguimiento",
    description: "Para retomar contacto después de una interacción.",
    blockCount: 6,
    makeBlocks: () => [
      h2("{{nombre}}, ¿cómo va todo?"),
      txt(
        "Hace un tiempo tuvimos la oportunidad de hablar y quería hacer un seguimiento para saber si pudimos ser de ayuda para ti o para tu equipo en {{empresa}}.\n\nSi tienes preguntas o quieres retomar la conversación, estoy disponible cuando lo necesites.",
      ),
      btn("Conversemos"),
      divider(),
      signature(),
      footer(),
    ],
  },
  {
    id: "oferta",
    name: "Oferta / Promoción",
    description: "Para comunicar un descuento o beneficio especial.",
    blockCount: 6,
    makeBlocks: () => [
      {
        id: id(),
        type: "hero",
        data: {
          title: "{{nombre}}, tenemos algo especial para ti",
          subtitle: "Una oferta pensada para {{empresa}}",
          ctaLabel: "",
          ctaHref: "",
          bg: "#1e293b",
          fg: "#ffffff",
        },
      },
      {
        id: id(),
        type: "highlight",
        data: {
          label: "OFERTA ESPECIAL",
          message: "Describe aquí el beneficio principal de tu oferta",
          code: "Válido hasta el [fecha límite]",
          accentColor: "#6366f1",
        },
      },
      img("https://goxt.io/_next/image?url=%2Fassets%2Fbento%2FEmpresas.jpg&w=1080&q=75", "Imagen de la oferta"),
      txt(
        "Hola {{nombre}},\n\nQueremos ofrecerte condiciones especiales. Esta es una oportunidad pensada para clientes como tú — cuéntanos qué necesitas y lo armamos juntos.",
      ),
      btn("Quiero aprovecharla", "#6366f1"),
      footer(),
    ],
  },
  {
    id: "festividades",
    name: "Festividades",
    description: "Saludo institucional para fechas especiales.",
    blockCount: 5,
    makeBlocks: () => [
      {
        id: id(),
        type: "hero",
        data: {
          title: "¡Felices Fiestas, {{nombre}}! 🎉",
          subtitle: "Un mensaje del equipo de {{empresa}}",
          ctaLabel: "",
          ctaHref: "",
          bg: "#0f172a",
          fg: "#ffffff",
        },
      },
      txt(
        "En estas fechas especiales, queremos tomarnos un momento para agradecerte por confiar en nosotros.\n\nEsperamos que disfrutes este tiempo con los tuyos y que el próximo año esté lleno de éxitos y nuevas oportunidades.\n\n¡Muchas gracias por tu confianza!",
        "#374151",
        "center",
      ),
      divider(),
      signature(),
      footer(),
    ],
  },
]
