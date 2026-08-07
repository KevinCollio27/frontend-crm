import * as React from "react"
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BadgePercentIcon,
  BoldIcon,
  Columns2Icon,
  CopyIcon,
  ImageIcon,
  ItalicIcon,
  LayoutGridIcon,
  LinkIcon,
  ListIcon,
  MailIcon,
  MinusIcon,
  MousePointerClickIcon,
  PanelBottomIcon,
  PhoneIcon,
  PilcrowIcon,
  QuoteIcon,
  Share2Icon,
  SquareIcon,
  Trash2Icon,
  TypeIcon,
  UnderlineIcon,
  UploadIcon,
  UserSquareIcon,
  VideoIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Field } from "@/components/ui/field"
import {
  FONT_OPTIONS,
  emptyBlock,
  type Align,
  type ButtonBlockData,
  type CampaignBlock,
  type BlockType,
  type TextStyleData,
} from "../shared/blocks"
import { FacebookIcon, InstagramIcon, LinkedInIcon, XSocialIcon } from "../shared/social-icons"
import { confirmDialog } from "@/lib/confirm"

const BLOCK_PALETTE: { type: BlockType; label: string; icon: React.ElementType }[] = [
  { type: "heading", label: "Título", icon: TypeIcon },
  { type: "text", label: "Texto", icon: PilcrowIcon },
  { type: "button", label: "Botón", icon: MousePointerClickIcon },
  { type: "image", label: "Imagen", icon: ImageIcon },
  { type: "imageText", label: "Imagen + Texto", icon: Columns2Icon },
  { type: "divider", label: "Divisor", icon: MinusIcon },
  { type: "spacer", label: "Espacio", icon: ArrowDownIcon },
  { type: "social", label: "Redes Sociales", icon: Share2Icon },
  { type: "footer", label: "Pie de página", icon: PanelBottomIcon },
  { type: "highlight", label: "Ficha Destacada", icon: BadgePercentIcon },
  { type: "signature", label: "Firma", icon: UserSquareIcon },
  { type: "hero", label: "Hero", icon: SquareIcon },
  { type: "columns", label: "Columnas", icon: LayoutGridIcon },
  { type: "list", label: "Lista", icon: ListIcon },
  { type: "quote", label: "Cita", icon: QuoteIcon },
  { type: "video", label: "Video", icon: VideoIcon },
]

// Sintaxis simple: **negrita** y _cursiva_ dentro de un mismo bloque de texto.
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|_(.+?)_/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    parts.push(match[1] !== undefined ? <strong key={key++}>{match[1]}</strong> : <em key={key++}>{match[2]}</em>)
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

interface BlockEditorProps {
  blocks: CampaignBlock[]
  setBlocks: (updater: (blocks: CampaignBlock[]) => CampaignBlock[]) => void
}

export function BlockEditor({ blocks, setBlocks }: BlockEditorProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(blocks[0]?.id ?? null)
  const selected = blocks.find((b) => b.id === selectedId)

  function addBlock(type: BlockType) {
    const b = emptyBlock(type)
    setBlocks((prev) => [...prev, b])
    setSelectedId(b.id)
  }
  function updateBlock(id: string, data: Partial<CampaignBlock["data"]>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, data: { ...b.data, ...data } } as CampaignBlock) : b))
    )
  }
  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }
  function duplicateBlock(id: string) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx < 0) return prev
      const copy = { ...prev[idx], id: crypto.randomUUID(), data: { ...prev[idx].data } } as CampaignBlock
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }
  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx < 0) return prev
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })
  }

  async function clearCanvas() {
    if (blocks.length === 0) return
    const ok = await confirmDialog({
      title: "¿Limpiar el lienzo?",
      description: "Esto eliminará todos los bloques. Esta acción no se puede deshacer.",
      confirmText: "Limpiar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!ok) return
    setBlocks(() => [])
    setSelectedId(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[180px_1fr_300px] lg:items-start">

      {/* Bloques */}
      <div className="sticky top-0 h-105 overflow-y-auto rounded-lg border bg-background p-2">
        <p className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Bloques
        </p>
        <div className="grid gap-1">
          {BLOCK_PALETTE.map((p) => {
            const Icon = p.icon
            return (
              <button
                key={p.type}
                type="button"
                onClick={() => addBlock(p.type)}
                className="flex items-center gap-2 rounded px-2 py-2 text-left text-xs transition-colors hover:bg-muted"
              >
                <Icon className="size-3.5 text-muted-foreground" />
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Vista previa — simula el correo, siempre claro sin importar el tema de la app */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Vista previa
          </p>
          {blocks.length > 0 && (
            <Button type="button" variant="ghost" size="xs" className="text-muted-foreground" onClick={clearCanvas}>
              <Trash2Icon className="size-3" /> Limpiar lienzo
            </Button>
          )}
        </div>
        <div className="min-h-105 rounded-lg border bg-white p-4">
          <div className="mx-auto max-w-150 space-y-2">
            {blocks.length === 0 && (
              <div className="py-16 text-center text-sm" style={{ color: "#9ca3af" }}>
                Añade bloques desde el panel izquierdo.
              </div>
            )}
            {blocks.map((b) => (
              <BlockPreview
                key={b.id}
                block={b}
                selected={selectedId === b.id}
                onSelect={() => setSelectedId(b.id)}
                onMoveUp={() => moveBlock(b.id, -1)}
                onMoveDown={() => moveBlock(b.id, 1)}
                onRemove={() => removeBlock(b.id)}
                onDuplicate={() => duplicateBlock(b.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Propiedades */}
      <div className="sticky top-0 h-105 overflow-y-auto rounded-lg border bg-background p-3">
        <p className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Propiedades
        </p>
        {selected ? (
          <BlockInspector block={selected} onChange={(data) => updateBlock(selected.id, data)} />
        ) : (
          <p className="text-xs text-muted-foreground">Selecciona un bloque para editarlo.</p>
        )}
      </div>
    </div>
  )
}

// ─── Canvas preview ────────────────────────────────────────────────────────────

interface BlockPreviewProps {
  block: CampaignBlock
  selected: boolean
  onSelect: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onDuplicate: () => void
}

function BlockPreview({ block, selected, onSelect, onMoveUp, onMoveDown, onRemove, onDuplicate }: BlockPreviewProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative cursor-pointer rounded border-2 p-2 transition-colors",
        selected ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
      )}
    >
      <div className="absolute -top-3 right-2 z-10 hidden items-center gap-0.5 rounded border bg-background shadow-sm group-hover:flex">
        <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp() }} className="rounded-l p-1 hover:bg-muted" title="Mover arriba">
          <ArrowUpIcon className="size-3" />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown() }} className="p-1 hover:bg-muted" title="Mover abajo">
          <ArrowDownIcon className="size-3" />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate() }} className="p-1 hover:bg-muted" title="Duplicar">
          <CopyIcon className="size-3" />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove() }} className="rounded-r p-1 hover:bg-destructive/10 hover:text-destructive" title="Eliminar">
          <Trash2Icon className="size-3" />
        </button>
      </div>
      <BlockRender block={block} />
    </div>
  )
}

function textStyle(d: TextStyleData): React.CSSProperties {
  return {
    textAlign: d.align,
    color: d.color,
    fontFamily: d.font,
    fontWeight: d.bold ? 700 : 400,
    fontStyle: d.italic ? "italic" : "normal",
    textDecoration: d.underline ? "underline" : "none",
    backgroundColor: d.backgroundColor || undefined,
    padding: d.backgroundColor ? "12px 16px" : undefined,
    borderRadius: d.backgroundColor ? 6 : undefined,
  }
}

export function BlockRender({ block }: { block: CampaignBlock }) {
  switch (block.type) {
    case "heading": {
      const d = block.data
      const Tag = d.level
      const sizeClass = d.level === "h1" ? "text-2xl" : d.level === "h2" ? "text-xl" : "text-lg"
      const parsed = parseInlineMarkdown(d.text || "Título principal")
      const content = d.href ? <a href={d.href} onClick={(e) => e.preventDefault()}>{parsed}</a> : parsed
      return <Tag className={sizeClass} style={textStyle(d)}>{content}</Tag>
    }
    case "text": {
      const d = block.data
      const parsed = parseInlineMarkdown(d.text || "Texto")
      const content = d.href ? <a href={d.href} onClick={(e) => e.preventDefault()}>{parsed}</a> : parsed
      return <p className="text-sm leading-relaxed whitespace-pre-wrap" style={textStyle(d)}>{content}</p>
    }
    case "button": {
      const d = block.data
      return (
        <div style={{ textAlign: d.align }}>
          <span
            className="inline-block px-5 py-2.5 text-sm font-medium"
            style={{ backgroundColor: d.color, color: d.textColor || "#fff", borderRadius: d.radius ?? 6 }}
          >
            {d.label || "Botón"}
          </span>
        </div>
      )
    }
    case "image": {
      const d = block.data
      const img = <img src={d.src} alt={d.alt} style={{ width: d.width }} className="mx-auto" />
      if (!d.src) {
        return (
          <div className="flex aspect-3/1 items-center justify-center rounded text-xs" style={{ background: "#f3f4f6", color: "#6b7280" }}>
            <ImageIcon className="mr-1.5 size-4" /> Configura la URL en propiedades
          </div>
        )
      }
      return d.href ? <a href={d.href} onClick={(e) => e.preventDefault()}>{img}</a> : img
    }
    case "divider":
      return <hr style={{ borderColor: block.data.color }} className="my-2" />
    case "spacer":
      return (
        <div
          style={{
            height: block.data.height,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 8px)",
          }}
          className="rounded"
        />
      )
    case "imageText": {
      const d = block.data
      const imageEl = d.src ? (
        <img src={d.src} alt={d.alt} className="w-full rounded" />
      ) : (
        <div className="flex aspect-square items-center justify-center rounded text-xs" style={{ background: "#f3f4f6", color: "#6b7280" }}>
          <ImageIcon className="mr-1.5 size-4" /> Sin imagen
        </div>
      )
      const textEl = (
        <div style={{ textAlign: d.textAlign }}>
          <div className="mb-1 text-sm font-semibold" style={{ color: "#111111" }}>{d.title || "Título"}</div>
          <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{d.text || "Texto"}</p>
        </div>
      )
      const parts = d.imagePosition === "right" ? [textEl, imageEl] : [imageEl, textEl]
      return <div className="grid grid-cols-2 items-center gap-3">{parts[0]}{parts[1]}</div>
    }
    case "social": {
      const d = block.data
      const items = [
        { key: "facebook", href: d.facebook, Icon: FacebookIcon, bg: "#1877F2" },
        { key: "instagram", href: d.instagram, Icon: InstagramIcon, bg: "linear-gradient(45deg,#f58529,#dd2a7b,#8134af,#515bd4)" },
        { key: "linkedin", href: d.linkedin, Icon: LinkedInIcon, bg: "#0A66C2" },
        { key: "twitter", href: d.twitter, Icon: XSocialIcon, bg: "#000000" },
      ].filter((i) => i.href)
      if (items.length === 0) {
        return <div className="py-3 text-center text-xs" style={{ color: "#9ca3af" }}>Agrega al menos una red social en Propiedades.</div>
      }
      return (
        <div className="flex justify-center gap-3 py-2">
          {items.map(({ key, href, Icon, bg }) => (
            <a
              key={key}
              href={href}
              onClick={(e) => e.preventDefault()}
              className="flex size-8 items-center justify-center rounded-full text-white"
              style={{ background: bg }}
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>
      )
    }
    case "footer": {
      const d = block.data
      return (
        <div className="space-y-1 border-t pt-3 text-center text-xs" style={{ color: "#6b7280" }}>
          <div className="font-semibold" style={{ color: "#111111" }}>{d.companyName || "Mi Empresa"}</div>
          <div>{d.address}</div>
          <div className="underline">{d.unsubscribeText}</div>
        </div>
      )
    }
    case "highlight": {
      const d = block.data
      return (
        <div
          className="rounded-lg border-2 border-dashed p-5 text-center"
          style={{ borderColor: d.accentColor, background: `${d.accentColor}0d` }}
        >
          {d.label && (
            <div className="mb-1 text-xs font-semibold tracking-wide uppercase" style={{ color: d.accentColor }}>
              {d.label}
            </div>
          )}
          <div className="text-lg font-bold" style={{ color: "#111111" }}>
            {parseInlineMarkdown(d.message || "Tu mensaje destacado aquí")}
          </div>
          {d.code && (
            <div
              className="mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{ background: "#ffffff", color: d.accentColor, border: `1px solid ${d.accentColor}` }}
            >
              {d.code}
            </div>
          )}
        </div>
      )
    }
    case "signature": {
      const d = block.data
      return (
        <div className="flex items-center gap-4">
          {d.logoSrc ? (
            <img
              src={d.logoSrc}
              alt="Logo"
              style={{ width: d.logoWidth, maxHeight: d.logoMaxHeight, objectFit: "contain" }}
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded text-[10px]" style={{ background: "#f3f4f6", color: "#9ca3af" }}>
              Logo
            </div>
          )}
          <div className="space-y-0.5 text-sm">
            <div className="font-semibold" style={{ color: "#111111" }}>{d.name || "Nombre Apellido"}</div>
            {d.role && <div style={{ color: "#6b7280" }}>{d.role}</div>}
            <div className="flex flex-col gap-0.5 pt-1" style={{ color: "#374151" }}>
              {d.phone && (
                <div className="flex items-center gap-1.5"><PhoneIcon className="size-3" />{d.phone}</div>
              )}
              {d.email && (
                <div className="flex items-center gap-1.5">
                  <MailIcon className="size-3" />
                  <a href={`mailto:${d.email}`} onClick={(e) => e.preventDefault()} style={{ color: "#2563eb" }}>{d.email}</a>
                </div>
              )}
              {d.website && (
                <div className="flex items-center gap-1.5">
                  <LinkIcon className="size-3" />
                  <a href={d.website} onClick={(e) => e.preventDefault()} style={{ color: "#2563eb" }}>{d.website}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
    case "hero": {
      const d = block.data
      return (
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: d.bg, color: d.fg }}>
          <div className="mb-2 text-2xl font-bold">{parseInlineMarkdown(d.title || "Título principal")}</div>
          {d.subtitle && <div className="mb-4 text-sm opacity-90">{d.subtitle}</div>}
          {d.ctaLabel && (
            <span className="inline-block rounded px-5 py-2.5 text-sm font-medium" style={{ background: "#ffffff", color: "#000000" }}>
              {d.ctaLabel}
            </span>
          )}
        </div>
      )
    }
    case "columns": {
      const d = block.data
      const gridClass = d.columns.length === 2 ? "grid-cols-2" : d.columns.length === 3 ? "grid-cols-3" : "grid-cols-4"
      return (
        <div className={cn("grid gap-3 text-sm", gridClass)}>
          {d.columns.map((c, i) => (
            <div key={i} className="rounded p-2 whitespace-pre-wrap" style={{ background: "#f3f4f6", color: "#374151" }}>
              {parseInlineMarkdown(c || `Columna ${i + 1}`)}
            </div>
          ))}
        </div>
      )
    }
    case "list": {
      const d = block.data
      const Tag = d.style === "number" ? "ol" : "ul"
      return (
        <Tag className={cn("space-y-1 pl-5 text-sm", d.style === "number" ? "list-decimal" : "list-disc")} style={{ color: "#374151" }}>
          {d.items.map((item, i) => <li key={i}>{parseInlineMarkdown(item)}</li>)}
        </Tag>
      )
    }
    case "quote": {
      const d = block.data
      return (
        <div className="border-l-4 py-1 pl-4" style={{ borderColor: "#6366f1" }}>
          <div className="text-sm italic" style={{ color: "#374151" }}>{parseInlineMarkdown(d.text || "Una cita inspiradora puede ir aquí.")}</div>
          {d.author && <div className="mt-1 text-xs" style={{ color: "#6b7280" }}>{d.author}</div>}
        </div>
      )
    }
    case "video": {
      const d = block.data
      return (
        <a
          href={d.href}
          onClick={(e) => e.preventDefault()}
          className="relative block aspect-video overflow-hidden rounded"
          style={{
            background: d.thumbnail ? undefined : "#18181b",
            backgroundImage: d.thumbnail ? `url(${d.thumbnail})` : undefined,
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-14 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.9)" }}>
              <div style={{ width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: "16px solid black", marginLeft: 4 }} />
            </div>
          </div>
          {d.caption && (
            <div className="absolute inset-x-0 bottom-0 px-3 py-2 text-xs text-white" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
              {d.caption}
            </div>
          )}
        </a>
      )
    }
  }
}

// ─── Inspector ─────────────────────────────────────────────────────────────────

const ALIGN_OPTIONS: { value: Align; icon: React.ElementType; title: string }[] = [
  { value: "left", icon: AlignLeftIcon, title: "Izquierda" },
  { value: "center", icon: AlignCenterIcon, title: "Centro" },
  { value: "right", icon: AlignRightIcon, title: "Derecha" },
  { value: "justify", icon: AlignJustifyIcon, title: "Justificado" },
]

function AlignField({ value, onChange, options }: { value: string; onChange: (v: Align) => void; options?: Align[] }) {
  const opts = options ? ALIGN_OPTIONS.filter((o) => options.includes(o.value)) : ALIGN_OPTIONS
  return (
    <Field label="Alineación">
      <div className="flex gap-1 rounded-lg border p-0.5">
        {opts.map((o) => {
          const Icon = o.icon
          return (
            <Button
              key={o.value}
              type="button"
              size="icon-sm"
              variant={value === o.value ? "default" : "ghost"}
              onClick={() => onChange(o.value)}
              title={o.title}
              className="flex-1"
            >
              <Icon className="size-3.5" />
            </Button>
          )
        })}
      </div>
    </Field>
  )
}

function TextStyleFields({ data, onChange }: { data: TextStyleData; onChange: (patch: Partial<TextStyleData>) => void }) {
  return (
    <>
      <Field label="Contenido">
        <Textarea value={data.text} onChange={(e) => onChange({ text: e.target.value })} rows={4} />
      </Field>
      <p className="-mt-1 text-[11px] text-muted-foreground">
        Usa <code className="rounded bg-muted px-1">**negrita**</code> y <code className="rounded bg-muted px-1">_cursiva_</code> para resaltar palabras puntuales.
      </p>
      <AlignField value={data.align} onChange={(v) => onChange({ align: v })} />
      <Field label="Estilo">
        <div className="flex gap-1 rounded-lg border p-0.5">
          <Button type="button" size="icon-sm" variant={data.bold ? "default" : "ghost"} onClick={() => onChange({ bold: !data.bold })} title="Negrita" className="flex-1">
            <BoldIcon className="size-3.5" />
          </Button>
          <Button type="button" size="icon-sm" variant={data.italic ? "default" : "ghost"} onClick={() => onChange({ italic: !data.italic })} title="Cursiva" className="flex-1">
            <ItalicIcon className="size-3.5" />
          </Button>
          <Button type="button" size="icon-sm" variant={data.underline ? "default" : "ghost"} onClick={() => onChange({ underline: !data.underline })} title="Subrayado" className="flex-1">
            <UnderlineIcon className="size-3.5" />
          </Button>
        </div>
      </Field>
      <Field label="Fuente">
        <Select value={data.font} onValueChange={(v) => onChange({ font: v ?? "inherit" })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Color">
        <Input type="color" value={data.color} onChange={(e) => onChange({ color: e.target.value })} className="h-9 p-1" />
      </Field>
      <Field label="Fondo (opcional)">
        <div className="flex items-center gap-2">
          <Switch
            checked={!!data.backgroundColor}
            onCheckedChange={(checked) => onChange({ backgroundColor: checked ? data.backgroundColor || "#f3f4f6" : "" })}
          />
          {data.backgroundColor && (
            <Input
              type="color"
              value={data.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="h-9 w-20 p-1"
            />
          )}
        </div>
      </Field>
      <Field label="Enlace (opcional)">
        <Input value={data.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://..." />
      </Field>
    </>
  )
}

// ─── Image upload helpers ─────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ImageUploadField({
  value,
  onChange,
  label = "Imagen",
}: {
  value: string
  onChange: (src: string) => void
  label?: string
}) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const isBase64 = value.startsWith("data:")
  const [mode, setMode] = React.useState<"url" | "upload">(isBase64 ? "upload" : "url")

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await fileToBase64(file)
    onChange(base64)
    e.target.value = ""
  }

  return (
    <Field label={label}>
      <div className="space-y-2">
        <div className="flex gap-1 rounded-lg border p-0.5">
          <Button
            type="button" size="sm"
            variant={mode === "url" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setMode("url")}
          >
            URL
          </Button>
          <Button
            type="button" size="sm"
            variant={mode === "upload" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setMode("upload")}
          >
            <UploadIcon className="size-3.5" /> Archivo
          </Button>
        </div>

        {mode === "url" ? (
          <Input
            value={isBase64 ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
          />
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <Button
              type="button" variant="outline" size="sm" className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <UploadIcon className="size-3.5" />
              {value ? "Cambiar imagen" : "Seleccionar imagen"}
            </Button>
          </>
        )}

        {value && (
          <div className="overflow-hidden rounded border bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="max-h-24 w-full object-contain" />
          </div>
        )}
      </div>
    </Field>
  )
}

// ─── Inspector ─────────────────────────────────────────────────────────────────

function BlockInspector({ block, onChange }: { block: CampaignBlock; onChange: (data: Partial<CampaignBlock["data"]>) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Field label="Nivel">
            <Select value={block.data.level} onValueChange={(v) => onChange({ level: (v ?? "h1") as "h1" | "h2" | "h3" })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <TextStyleFields data={block.data} onChange={onChange} />
        </div>
      )
    case "text":
      return (
        <div className="space-y-2">
          <TextStyleFields data={block.data} onChange={onChange} />
        </div>
      )
    case "button": {
      const d = block.data
      const onChangeButton = (patch: Partial<ButtonBlockData>) => onChange(patch)
      return (
        <div className="space-y-2">
          <Field label="Texto">
            <Input value={d.label} onChange={(e) => onChangeButton({ label: e.target.value })} />
          </Field>
          <Field label="URL">
            <Input value={d.href} onChange={(e) => onChangeButton({ href: e.target.value })} placeholder="https://..." />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Fondo">
              <Input type="color" value={d.color} onChange={(e) => onChangeButton({ color: e.target.value })} className="h-9 p-1" />
            </Field>
            <Field label="Texto">
              <Input type="color" value={d.textColor || "#ffffff"} onChange={(e) => onChangeButton({ textColor: e.target.value })} className="h-9 p-1" />
            </Field>
          </div>
          <Field label="Radio (px)">
            <Input type="number" value={d.radius ?? 6} onChange={(e) => onChangeButton({ radius: Number(e.target.value) })} />
          </Field>
          <AlignField value={d.align} onChange={(v) => onChangeButton({ align: v as "left" | "center" | "right" })} options={["left", "center", "right"]} />
        </div>
      )
    }
    case "image": {
      const d = block.data
      return (
        <div className="space-y-2">
          <ImageUploadField value={d.src} onChange={(src) => onChange({ src })} />
          <Field label="Alt">
            <Input value={d.alt} onChange={(e) => onChange({ alt: e.target.value })} />
          </Field>
          <Field label="Ancho">
            <Input value={d.width} onChange={(e) => onChange({ width: e.target.value })} placeholder="100% / 400px" />
          </Field>
          <Field label="Enlace (opcional)">
            <Input value={d.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://..." />
          </Field>
        </div>
      )
    }
    case "divider":
      return (
        <Field label="Color">
          <Input type="color" value={block.data.color} onChange={(e) => onChange({ color: e.target.value })} className="h-9 p-1" />
        </Field>
      )
    case "spacer":
      return (
        <Field label="Altura (px)">
          <Input
            type="number"
            value={block.data.height}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
          />
        </Field>
      )
    case "imageText": {
      const d = block.data
      return (
        <div className="space-y-2">
          <ImageUploadField value={d.src} onChange={(src) => onChange({ src })} />
          <Field label="Alt">
            <Input value={d.alt} onChange={(e) => onChange({ alt: e.target.value })} />
          </Field>
          <Field label="Título">
            <Input value={d.title} onChange={(e) => onChange({ title: e.target.value })} />
          </Field>
          <Field label="Texto">
            <Textarea value={d.text} onChange={(e) => onChange({ text: e.target.value })} rows={3} />
          </Field>
          <Field label="Posición de imagen">
            <div className="flex gap-1 rounded-lg border p-0.5">
              <Button
                type="button"
                size="sm"
                variant={d.imagePosition === "left" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => onChange({ imagePosition: "left" })}
              >
                Izquierda
              </Button>
              <Button
                type="button"
                size="sm"
                variant={d.imagePosition === "right" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => onChange({ imagePosition: "right" })}
              >
                Derecha
              </Button>
            </div>
          </Field>
          <AlignField
            value={d.textAlign}
            onChange={(v) => onChange({ textAlign: v as "left" | "center" | "right" })}
            options={["left", "center", "right"]}
          />
        </div>
      )
    }
    case "social": {
      const d = block.data
      return (
        <div className="space-y-2">
          <Field label="Facebook">
            <Input value={d.facebook} onChange={(e) => onChange({ facebook: e.target.value })} placeholder="https://facebook.com/..." />
          </Field>
          <Field label="Instagram">
            <Input value={d.instagram} onChange={(e) => onChange({ instagram: e.target.value })} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="LinkedIn">
            <Input value={d.linkedin} onChange={(e) => onChange({ linkedin: e.target.value })} placeholder="https://linkedin.com/..." />
          </Field>
          <Field label="X (Twitter)">
            <Input value={d.twitter} onChange={(e) => onChange({ twitter: e.target.value })} placeholder="https://x.com/..." />
          </Field>
        </div>
      )
    }
    case "footer": {
      const d = block.data
      return (
        <div className="space-y-2">
          <Field label="Empresa">
            <Input value={d.companyName} onChange={(e) => onChange({ companyName: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <Input value={d.address} onChange={(e) => onChange({ address: e.target.value })} />
          </Field>
          <Field label="Texto de baja">
            <Input value={d.unsubscribeText} onChange={(e) => onChange({ unsubscribeText: e.target.value })} />
          </Field>
        </div>
      )
    }
    case "highlight": {
      const d = block.data
      return (
        <div className="space-y-2">
          <Field label="Etiqueta superior (opcional)">
            <Input value={d.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="OFERTA ESPECIAL" />
          </Field>
          <Field label="Mensaje principal">
            <Textarea value={d.message} onChange={(e) => onChange({ message: e.target.value })} rows={2} />
          </Field>
          <Field label="Código / Badge (opcional)">
            <Input value={d.code} onChange={(e) => onChange({ code: e.target.value })} placeholder="CÓDIGO: PROMO15" />
          </Field>
          <Field label="Color de acento">
            <Input type="color" value={d.accentColor} onChange={(e) => onChange({ accentColor: e.target.value })} className="h-9 p-1" />
          </Field>
        </div>
      )
    }
    case "signature": {
      const d = block.data
      return (
        <div className="space-y-2">
          <ImageUploadField value={d.logoSrc} onChange={(logoSrc) => onChange({ logoSrc })} label="Logo (opcional)" />

          <div className="grid grid-cols-2 gap-2">
            <Field label="Ancho del logo">
              <Input value={d.logoWidth} onChange={(e) => onChange({ logoWidth: e.target.value })} placeholder="100px" />
            </Field>
            <Field label="Alto máximo">
              <Input value={d.logoMaxHeight} onChange={(e) => onChange({ logoMaxHeight: e.target.value })} placeholder="48px" />
            </Field>
          </div>
          <Field label="Nombre">
            <Input value={d.name} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>
          <Field label="Cargo">
            <Input value={d.role} onChange={(e) => onChange({ role: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <Input value={d.phone} onChange={(e) => onChange({ phone: e.target.value })} />
          </Field>
          <Field label="Correo">
            <Input type="email" value={d.email} onChange={(e) => onChange({ email: e.target.value })} />
          </Field>
          <Field label="Sitio web">
            <Input value={d.website} onChange={(e) => onChange({ website: e.target.value })} placeholder="https://..." />
          </Field>
        </div>
      )
    }
    case "hero": {
      const d = block.data
      return (
        <div className="space-y-2">
          <Field label="Título">
            <Input value={d.title} onChange={(e) => onChange({ title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <Textarea value={d.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} rows={2} />
          </Field>
          <Field label="Texto del botón">
            <Input value={d.ctaLabel} onChange={(e) => onChange({ ctaLabel: e.target.value })} />
          </Field>
          <Field label="URL del botón">
            <Input value={d.ctaHref} onChange={(e) => onChange({ ctaHref: e.target.value })} placeholder="https://..." />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Fondo">
              <Input type="color" value={d.bg} onChange={(e) => onChange({ bg: e.target.value })} className="h-9 p-1" />
            </Field>
            <Field label="Texto">
              <Input type="color" value={d.fg} onChange={(e) => onChange({ fg: e.target.value })} className="h-9 p-1" />
            </Field>
          </div>
        </div>
      )
    }
    case "columns": {
      const d = block.data
      function setCount(n: number) {
        const next = Array.from({ length: n }, (_, i) => d.columns[i] ?? "")
        onChange({ columns: next })
      }
      return (
        <div className="space-y-2">
          <Field label="N° de columnas">
            <div className="flex gap-1 rounded-lg border p-0.5">
              {[2, 3, 4].map((n) => (
                <Button key={n} type="button" size="sm" variant={d.columns.length === n ? "default" : "ghost"} className="flex-1" onClick={() => setCount(n)}>
                  {n}
                </Button>
              ))}
            </div>
          </Field>
          {d.columns.map((c, i) => (
            <Field key={i} label={`Columna ${i + 1}`}>
              <Textarea
                value={c}
                onChange={(e) => {
                  const next = [...d.columns]
                  next[i] = e.target.value
                  onChange({ columns: next })
                }}
                rows={2}
              />
            </Field>
          ))}
        </div>
      )
    }
    case "list": {
      const d = block.data
      return (
        <div className="space-y-2">
          <Field label="Estilo">
            <Select value={d.style} onValueChange={(v) => onChange({ style: (v ?? "bullet") as "bullet" | "number" })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="bullet">Viñetas</SelectItem>
                  <SelectItem value="number">Numerada</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ítems (uno por línea)">
            <Textarea
              value={d.items.join("\n")}
              onChange={(e) => onChange({ items: e.target.value.split("\n").filter(Boolean) })}
              rows={5}
            />
          </Field>
        </div>
      )
    }
    case "quote": {
      const d = block.data
      return (
        <div className="space-y-2">
          <Field label="Cita">
            <Textarea value={d.text} onChange={(e) => onChange({ text: e.target.value })} rows={3} />
          </Field>
          <Field label="Autor">
            <Input value={d.author} onChange={(e) => onChange({ author: e.target.value })} />
          </Field>
        </div>
      )
    }
    case "video": {
      const d = block.data
      return (
        <div className="space-y-2">
          <Field label="URL del video">
            <Input value={d.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="Thumbnail (URL)">
            <Input value={d.thumbnail} onChange={(e) => onChange({ thumbnail: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="Subtítulo">
            <Input value={d.caption} onChange={(e) => onChange({ caption: e.target.value })} />
          </Field>
        </div>
      )
    }
  }
}
