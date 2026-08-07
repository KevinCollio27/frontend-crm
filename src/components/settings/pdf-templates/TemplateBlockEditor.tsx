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
import { BoldPlugin, ItalicPlugin, UnderlinePlugin } from "@platejs/basic-nodes/react"
import { IndentPlugin } from "@platejs/indent/react"
import { ListPlugin } from "@platejs/list/react"
import { toggleList } from "@platejs/list"
import { BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon, UnderlineIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── Modelo de nodos (espejo simplificado del value de Plate) ─────────────────
// Mismo subset que soporta parseHtmlToBlocks/resolveTemplateVariables (src/lib/htmlToBlocks.ts):
// párrafo, negrita/cursiva/subrayado, lista con/sin viñeta. Sin headings ni checklist —
// no se usan en las plantillas reales (ver plan de Fase 2b).

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
}

const EMPTY_VALUE: ElementNode[] = [{ type: KEYS.p, children: [{ text: "" }] }]

// ─── HTML → value ───────────────────────────────────────────────────────────

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

  function pushBlock(el: HTMLElement) {
    const children = parseInline(el)
    nodes.push({ type: KEYS.p, children: children.length ? children : [{ text: "" }] })
  }

  function walkList(listEl: HTMLElement, listStyleType: string, indent: number) {
    Array.from(listEl.children).forEach((child) => {
      if (child.tagName !== "LI") return
      const li = child as HTMLElement

      const inlineNodes = Array.from(li.childNodes).filter(
        (n) => !(n.nodeType === Node.ELEMENT_NODE && ["UL", "OL"].includes((n as HTMLElement).tagName))
      )
      const children = inlineNodes.flatMap((n) => parseInline(n))

      nodes.push({
        type: KEYS.p,
        children: children.length ? children : [{ text: "" }],
        listStyleType,
        indent,
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
      case "UL":
        walkList(node, KEYS.ul, 1)
        break
      case "OL":
        walkList(node, KEYS.ol, 1)
        break
      default:
        if (node.textContent?.trim()) pushBlock(node)
        break
    }
  })

  return nodes.length ? nodes : EMPTY_VALUE
}

// ─── value → HTML ───────────────────────────────────────────────────────────

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
        items.push(`<li>${serializeChildren(value[i].children)}</li>`)
        i++
      }
      out.push(`<${tag}>${items.join("")}</${tag}>`)
      continue
    }

    out.push(`<p>${serializeChildren(node.children)}</p>`)
    i++
  }

  return out.join("")
}

// ─── Elementos custom ─────────────────────────────────────────────────────────

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

function ParagraphElement({ children, ...props }: PlateElementProps) {
  const listStyleType = (props.element as ElementNode).listStyleType

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

// ─── Plugins ────────────────────────────────────────────────────────────────

function createEditorPlugins() {
  return [
    ParagraphPlugin.withComponent(ParagraphElement),
    BoldPlugin.withComponent(BoldLeaf),
    ItalicPlugin.withComponent(ItalicLeaf),
    UnderlinePlugin.withComponent(UnderlineLeaf),
    IndentPlugin.configure({ inject: { targetPlugins: [KEYS.p] } }),
    ListPlugin,
  ]
}

// ─── Toolbar ────────────────────────────────────────────────────────────────

function ToolbarButton({ onToggle, icon: Icon, label }: { onToggle: () => void; icon: React.ElementType; label: string }) {
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
    bold: { toggle: () => void }
    italic: { toggle: () => void }
    underline: { toggle: () => void }
  }
}

function EditorToolbar() {
  const editor = useEditorRef<ToggleableEditor>()

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 bg-muted/30 p-1">
      <ToolbarButton icon={BoldIcon} label="Negrita" onToggle={() => editor.tf.bold.toggle()} />
      <ToolbarButton icon={ItalicIcon} label="Cursiva" onToggle={() => editor.tf.italic.toggle()} />
      <ToolbarButton icon={UnderlineIcon} label="Subrayado" onToggle={() => editor.tf.underline.toggle()} />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton icon={ListIcon} label="Viñetas" onToggle={() => toggleList(editor, { listStyleType: KEYS.ul })} />
      <ToolbarButton icon={ListOrderedIcon} label="Lista numerada" onToggle={() => toggleList(editor, { listStyleType: KEYS.ol })} />
    </div>
  )
}

// ─── Variables ────────────────────────────────────────────────────────────────

const VARIABLES = [
  "{{contact.name}}",
  "{{organization.name}}",
  "{{sender.name}}",
  "{{workspace.name}}",
  "{{quotation.code}}",
  "{{quotation.total}}",
  "{{quotation.valid_until}}",
  "{{date}}",
]

function VariableChips() {
  const editor = useEditorRef()

  return (
    <div className="flex flex-wrap gap-1.5 pt-2">
      {VARIABLES.map((variable) => (
        <button
          key={variable}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(editor as any).insertText(variable)
          }}
          className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {variable}
        </button>
      ))}
    </div>
  )
}

// ─── Componente público ─────────────────────────────────────────────────────────

interface TemplateBlockEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function TemplateBlockEditor({ value, onChange, placeholder }: TemplateBlockEditorProps) {
  const editor = usePlateEditor({
    plugins: createEditorPlugins(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: htmlToValue(value) as any,
  })

  return (
    <Plate
      editor={editor}
      onChange={({ value: newValue }) => onChange(valueToHtml(newValue as unknown as ElementNode[]))}
    >
      <EditorToolbar />
      <div className={cn("flex min-h-32 resize-y flex-col overflow-y-auto rounded-b-md border bg-background px-4 py-3")}>
        <PlateContent
          placeholder={placeholder ?? "Escribe el contenido del bloque..."}
          className="flex-1 text-sm leading-relaxed focus:outline-none"
        />
      </div>
      <VariableChips />
    </Plate>
  )
}
