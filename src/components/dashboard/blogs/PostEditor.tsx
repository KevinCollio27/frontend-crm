"use client"

import * as React from "react"
import {
  Plate,
  PlateContent,
  PlateElement,
  PlateLeaf,
  ParagraphPlugin,
  useEditorRef,
  usePlateEditor,
  type PlateEditor,
  type PlateElementProps,
  type PlateLeafProps,
} from "platejs/react"
import { KEYS } from "@platejs/utils"
import {
  BoldPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react"
import { IndentPlugin } from "@platejs/indent/react"
import { ListPlugin, useTodoListElement, useTodoListElementState } from "@platejs/list/react"
import { toggleList } from "@platejs/list"
import {
  BoldIcon,
  CheckSquareIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── Modelo de nodos (espejo simplificado del value de Plate) ─────────────────

interface TextNode {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

interface ElementNode {
  type: string
  children: TextNode[]
  listStyleType?: string
  indent?: number
  checked?: boolean
}

const EMPTY_VALUE: ElementNode[] = [{ type: KEYS.p, children: [{ text: "" }] }]

// ─── HTML → value (carga de contenido existente) ───────────────────────────────

function parseInline(node: ChildNode, marks: Partial<TextNode> = {}): TextNode[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ""
    return text ? [{ text, ...marks }] : []
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []

  const el = node as HTMLElement
  const nextMarks = { ...marks }
  if (el.tagName === "STRONG" || el.tagName === "B") nextMarks.bold = true
  if (el.tagName === "EM" || el.tagName === "I") nextMarks.italic = true
  if (el.tagName === "U") nextMarks.underline = true

  return Array.from(el.childNodes).flatMap((child) => parseInline(child, nextMarks))
}

function htmlToValue(html: string): ElementNode[] {
  if (typeof window === "undefined" || !html.trim()) return EMPTY_VALUE

  const doc = new DOMParser().parseFromString(html, "text/html")
  const nodes: ElementNode[] = []

  function pushBlock(type: string, el: HTMLElement) {
    const children = parseInline(el)
    nodes.push({ type, children: children.length ? children : [{ text: "" }] })
  }

  function walkList(listEl: HTMLElement, listStyleType: string, indent: number) {
    Array.from(listEl.children).forEach((child) => {
      if (child.tagName !== "LI") return
      const li = child as HTMLElement
      const checkbox = li.querySelector(":scope > input[type=checkbox]") as HTMLInputElement | null
      const isTodo = !!checkbox

      const inlineNodes = Array.from(li.childNodes).filter(
        (n) => !(n.nodeType === Node.ELEMENT_NODE && ["UL", "OL"].includes((n as HTMLElement).tagName))
      )
      const children = inlineNodes.flatMap((n) => parseInline(n))

      nodes.push({
        type: KEYS.p,
        children: children.length ? children : [{ text: "" }],
        listStyleType: isTodo ? KEYS.listTodo : listStyleType,
        indent,
        ...(isTodo ? { checked: checkbox?.hasAttribute("checked") } : {}),
      })

      const nested = li.querySelector(":scope > ul, :scope > ol")
      if (nested) {
        walkList(nested as HTMLElement, (nested as HTMLElement).tagName === "OL" ? KEYS.ol : KEYS.ul, indent + 1)
      }
    })
  }

  Array.from(doc.body.children).forEach((el) => {
    const node = el as HTMLElement
    switch (node.tagName) {
      case "H1":
        pushBlock(KEYS.h1, node)
        break
      case "H2":
        pushBlock(KEYS.h2, node)
        break
      case "H3":
        pushBlock(KEYS.h3, node)
        break
      case "UL":
        walkList(node, KEYS.ul, 1)
        break
      case "OL":
        walkList(node, KEYS.ol, 1)
        break
      default:
        if (node.textContent?.trim()) pushBlock(KEYS.p, node)
        break
    }
  })

  return nodes.length ? nodes : EMPTY_VALUE
}

// ─── value → HTML (guardado) ───────────────────────────────────────────────────
// Nota: listas anidadas (indent > 1) se serializan en un solo nivel por ahora.

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function serializeChildren(children: TextNode[]): string {
  return children
    .map((leaf) => {
      let html = escapeHtml(leaf.text)
      if (leaf.bold) html = `<strong>${html}</strong>`
      if (leaf.italic) html = `<em>${html}</em>`
      if (leaf.underline) html = `<u>${html}</u>`
      return html
    })
    .join("")
}

function valueToHtml(value: ElementNode[]): string {
  const out: string[] = []
  let i = 0

  while (i < value.length) {
    const node = value[i]

    if (node.listStyleType) {
      const tag = node.listStyleType === KEYS.ol ? "ol" : "ul"
      const items: string[] = []
      while (i < value.length && value[i].listStyleType) {
        const item = value[i]
        if (item.listStyleType === KEYS.listTodo) {
          items.push(
            `<li><input type="checkbox" disabled${item.checked ? " checked" : ""} /> ${serializeChildren(item.children)}</li>`
          )
        } else {
          items.push(`<li>${serializeChildren(item.children)}</li>`)
        }
        i++
      }
      out.push(`<${tag}>${items.join("")}</${tag}>`)
      continue
    }

    if (node.type === KEYS.h1 || node.type === KEYS.h2 || node.type === KEYS.h3) {
      out.push(`<${node.type}>${serializeChildren(node.children)}</${node.type}>`)
    } else {
      out.push(`<p>${serializeChildren(node.children)}</p>`)
    }
    i++
  }

  return out.join("")
}

// ─── Elementos custom (vista interactiva del editor) ───────────────────────────

const HEADING_STYLES: Record<string, string> = {
  [KEYS.h1]: "text-2xl font-bold mt-5 mb-2",
  [KEYS.h2]: "text-xl font-bold mt-4 mb-2",
  [KEYS.h3]: "text-base font-semibold mt-3 mb-1.5",
}

function HeadingElement({ children, ...props }: PlateElementProps) {
  const tag = props.element.type as "h1" | "h2" | "h3"
  return (
    <PlateElement as={tag} className={HEADING_STYLES[tag]} {...props}>
      {children}
    </PlateElement>
  )
}

// Plate envuelve automáticamente los hijos en un <ol>/<ul><li> nativo cuando
// el elemento tiene listStyleType (numeración/viñeta real del navegador vía
// list-style-type + start), así que estos componentes solo aportan indentación
// y estilos — no deben renderizar su propio marcador.

function BulletElement({ children, style, ...props }: PlateElementProps) {
  const indent = ((props.element as ElementNode).indent ?? 1) as number
  return (
    <PlateElement
      as="div"
      className="py-0.5 [&_ol]:pl-6! [&_ul]:pl-6! marker:text-muted-foreground"
      style={{ ...style, marginLeft: (indent - 1) * 24 }}
      {...props}
    >
      {children}
    </PlateElement>
  )
}

function OrderedElement({ children, style, ...props }: PlateElementProps) {
  const indent = ((props.element as ElementNode).indent ?? 1) as number
  return (
    <PlateElement
      as="div"
      className="py-0.5 [&_ol]:pl-6! [&_ul]:pl-6! marker:text-sm marker:text-muted-foreground marker:tabular-nums"
      style={{ ...style, marginLeft: (indent - 1) * 24 }}
      {...props}
    >
      {children}
    </PlateElement>
  )
}

function TodoElement({ children, style, ...props }: PlateElementProps) {
  const state = useTodoListElementState({ element: props.element })
  const { checkboxProps } = useTodoListElement(state)
  const indent = ((props.element as ElementNode).indent ?? 1) as number

  return (
    <PlateElement
      as="div"
      className="flex items-start gap-2 py-0.5 pl-1 [&_li]:list-none! [&_ol]:list-none! [&_ul]:list-none!"
      style={{ ...style, marginLeft: (indent - 1) * 24 }}
      {...props}
    >
      <span contentEditable={false} className="mt-1 select-none">
        <input
          type="checkbox"
          checked={checkboxProps.checked}
          onChange={(e) => checkboxProps.onCheckedChange(e.target.checked)}
          onMouseDown={checkboxProps.onMouseDown}
          className="size-3.5 cursor-pointer accent-primary"
        />
      </span>
      <span className={cn("flex-1", checkboxProps.checked && "text-muted-foreground line-through")}>
        {children}
      </span>
    </PlateElement>
  )
}

function ParagraphElement({ children, ...props }: PlateElementProps) {
  const listStyleType = (props.element as ElementNode).listStyleType

  if (listStyleType === KEYS.listTodo) return <TodoElement {...props}>{children}</TodoElement>
  if (listStyleType === KEYS.ul) return <BulletElement {...props}>{children}</BulletElement>
  if (listStyleType === KEYS.ol) return <OrderedElement {...props}>{children}</OrderedElement>

  return (
    <PlateElement as="p" className="py-0.5 leading-relaxed" {...props}>
      {children}
    </PlateElement>
  )
}

function BoldLeaf({ children, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf as="strong" className="font-semibold" {...props}>
      {children}
    </PlateLeaf>
  )
}

function ItalicLeaf({ children, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf as="em" {...props}>
      {children}
    </PlateLeaf>
  )
}

function UnderlineLeaf({ children, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf as="u" {...props}>
      {children}
    </PlateLeaf>
  )
}

// ─── Plugins ────────────────────────────────────────────────────────────────────

function createEditorPlugins() {
  return [
    ParagraphPlugin.withComponent(ParagraphElement),
    H1Plugin.withComponent(HeadingElement),
    H2Plugin.withComponent(HeadingElement),
    H3Plugin.withComponent(HeadingElement),
    BoldPlugin.withComponent(BoldLeaf),
    ItalicPlugin.withComponent(ItalicLeaf),
    UnderlinePlugin.withComponent(UnderlineLeaf),
    IndentPlugin.configure({ inject: { targetPlugins: [KEYS.p] } }),
    ListPlugin,
  ]
}

// ─── Toolbar ────────────────────────────────────────────────────────────────────

function ToolbarButton({
  onToggle,
  icon: Icon,
  label,
}: {
  onToggle: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={label}
      aria-label={label}
      onMouseDown={(e) => {
        e.preventDefault()
        onToggle()
      }}
    >
      <Icon className="size-4" />
    </Button>
  )
}

type ToggleableEditor = PlateEditor & {
  tf: PlateEditor["tf"] & {
    h1: { toggle: () => void }
    h2: { toggle: () => void }
    h3: { toggle: () => void }
    bold: { toggle: () => void }
    italic: { toggle: () => void }
    underline: { toggle: () => void }
  }
}

function EditorToolbar() {
  const editor = useEditorRef<ToggleableEditor>()

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 bg-muted/30 p-1">
      <ToolbarButton icon={Heading1Icon} label="Título 1" onToggle={() => editor.tf.h1.toggle()} />
      <ToolbarButton icon={Heading2Icon} label="Título 2" onToggle={() => editor.tf.h2.toggle()} />
      <ToolbarButton icon={Heading3Icon} label="Título 3" onToggle={() => editor.tf.h3.toggle()} />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton icon={BoldIcon} label="Negrita" onToggle={() => editor.tf.bold.toggle()} />
      <ToolbarButton icon={ItalicIcon} label="Cursiva" onToggle={() => editor.tf.italic.toggle()} />
      <ToolbarButton icon={UnderlineIcon} label="Subrayado" onToggle={() => editor.tf.underline.toggle()} />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton
        icon={ListIcon}
        label="Viñetas"
        onToggle={() => toggleList(editor, { listStyleType: KEYS.ul })}
      />
      <ToolbarButton
        icon={ListOrderedIcon}
        label="Lista numerada"
        onToggle={() => toggleList(editor, { listStyleType: KEYS.ol })}
      />
      <ToolbarButton
        icon={CheckSquareIcon}
        label="Checklist"
        onToggle={() => toggleList(editor, { listStyleType: KEYS.listTodo })}
      />
    </div>
  )
}

// ─── Plain-text paste parser ────────────────────────────────────────────────────
// Convierte texto plano con patrones tipo markdown a nodos de Plate.
// Solo se activa si el texto pegado contiene al menos un patrón reconocible.

const PLAIN_TEXT_PATTERN = /^(\d+\.\s|[-*•]\s|#{1,3}\s)/m

function parsePlainText(text: string): ElementNode[] {
  const nodes: ElementNode[] = []
  for (const raw of text.split(/\r?\n/)) {
    const h3 = raw.match(/^###\s+(.+)/)
    const h2 = raw.match(/^##\s+(.+)/)
    const h1 = raw.match(/^#\s+(.+)/)
    const ol = raw.match(/^\d+\.\s+(.*)/)
    const ul = raw.match(/^[-*•]\s+(.*)/)

    if (h1)      nodes.push({ type: KEYS.h1, children: [{ text: h1[1] }] })
    else if (h2) nodes.push({ type: KEYS.h2, children: [{ text: h2[1] }] })
    else if (h3) nodes.push({ type: KEYS.h3, children: [{ text: h3[1] }] })
    else if (ol) nodes.push({ type: KEYS.p, listStyleType: KEYS.ol, indent: 1, children: [{ text: ol[1] }] })
    else if (ul) nodes.push({ type: KEYS.p, listStyleType: KEYS.ul, indent: 1, children: [{ text: ul[1] }] })
    else         nodes.push({ type: KEYS.p, children: [{ text: raw }] })
  }
  return nodes.length ? nodes : EMPTY_VALUE
}

// ─── Componente público ─────────────────────────────────────────────────────────

interface PostEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function PostEditor({ value, onChange, placeholder }: PostEditorProps) {
  const editor = usePlateEditor({
    plugins: createEditorPlugins(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: htmlToValue(value) as any,
  })

  // onPasteCapture corre en fase de captura, antes de que el evento llegue a
  // PlateContent. stopPropagation() evita que Plate procese el mismo paste y
  // duplique el contenido (una vez formateado, una vez como texto crudo).
  function handlePasteCapture(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text/plain")
    if (!text || !PLAIN_TEXT_PATTERN.test(text)) return
    e.preventDefault()
    e.stopPropagation()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor.insertFragment(parsePlainText(text) as any)
  }

  return (
    <Plate
      editor={editor}
      onChange={({ value: newValue }) => onChange(valueToHtml(newValue as unknown as ElementNode[]))}
    >
      <EditorToolbar />
      <div
        className="flex min-h-50 resize-y flex-col overflow-y-auto rounded-b-md border bg-background px-4 py-3"
        onPasteCapture={handlePasteCapture}
      >
        <PlateContent
          placeholder={placeholder ?? "Escribe el contenido del post..."}
          className="flex-1 text-sm leading-relaxed focus:outline-none"
        />
      </div>
    </Plate>
  )
}
