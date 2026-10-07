import type { ParsedBlock, TextNode } from "@/types/pdfTemplate"

// Versión de servidor de parseHtmlToBlocks (htmlToBlocks.ts), que usa DOMParser y por eso
// solo corre en el navegador. Cubre el HTML que produce el editor de plantillas (TipTap):
// p, h1–h3, ul/ol/li, strong/b, em/i, u y text-align. Debe dar el mismo resultado que la
// versión de navegador: si se agrega una etiqueta allá, agregarla también acá.

interface HtmlElement {
  tag: string
  attrs: Record<string, string>
  children: HtmlNode[]
}
type HtmlNode = HtmlElement | string

const VOID_TAGS = new Set(["br", "hr", "img", "input"])
type Marks = { bold?: boolean; italic?: boolean; underline?: boolean }
type TextAlign = "left" | "center" | "right" | "justify"

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? match
    const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
    return Number.isFinite(point) ? String.fromCodePoint(point) : match
  })
}

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  for (const match of source.matchAll(/([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? "")
  }
  return attrs
}

function parseHtml(html: string): HtmlNode[] {
  const root: HtmlElement = { tag: "#root", attrs: {}, children: [] }
  const stack = [root]
  const tokens = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s[^<>]*?)?)(\/?)>|([^<]+)/g

  for (const match of html.matchAll(tokens)) {
    const [, closeTag, openTag, attrSource, selfClosing, text] = match
    const parent = stack[stack.length - 1]
    if (text !== undefined) {
      parent.children.push(decodeEntities(text))
    } else if (openTag) {
      const element: HtmlElement = { tag: openTag.toLowerCase(), attrs: parseAttrs(attrSource ?? ""), children: [] }
      parent.children.push(element)
      if (!selfClosing && !VOID_TAGS.has(element.tag)) stack.push(element)
    } else if (closeTag) {
      const index = stack.map((el) => el.tag).lastIndexOf(closeTag.toLowerCase())
      if (index > 0) stack.length = index
    }
  }
  return root.children
}

function inlineNodes(node: HtmlNode, marks: Marks = {}): TextNode[] {
  if (typeof node === "string") return node ? [{ type: "text", text: node, ...marks }] : []
  const next = { ...marks }
  if (node.tag === "strong" || node.tag === "b") next.bold = true
  if (node.tag === "em" || node.tag === "i") next.italic = true
  if (node.tag === "u") next.underline = true
  return node.children.flatMap((child) => inlineNodes(child, next))
}

function textAlignOf(element: HtmlElement): TextAlign | undefined {
  const value = element.attrs.style?.match(/text-align\s*:\s*(left|center|right|justify)/i)?.[1]
  return value?.toLowerCase() as TextAlign | undefined
}

function findElement(node: HtmlNode, tag: string): HtmlElement | null {
  if (typeof node === "string") return null
  if (node.tag === tag) return node
  for (const child of node.children) {
    const found = findElement(child, tag)
    if (found) return found
  }
  return null
}

function listItems(list: HtmlElement): TextNode[][] {
  return list.children
    .filter((child): child is HtmlElement => typeof child !== "string" && child.tag === "li")
    .map((li) => {
      // TipTap envuelve el contenido del li en un <p>.
      const paragraph = li.children.map((child) => findElement(child, "p")).find(Boolean)
      return inlineNodes(paragraph ?? li)
    })
}

function blockOf(node: HtmlNode): ParsedBlock | null {
  if (typeof node === "string") return null
  const textAlign = textAlignOf(node)
  if (node.tag === "p") {
    const children = inlineNodes(node)
    return children.length ? { type: "paragraph", children, ...(textAlign ? { textAlign } : {}) } : null
  }
  if (node.tag === "h1" || node.tag === "h2" || node.tag === "h3") {
    return { type: "heading", level: parseInt(node.tag[1]), children: inlineNodes(node), ...(textAlign ? { textAlign } : {}) }
  }
  if (node.tag === "ul") return { type: "bullet_list", items: listItems(node) }
  if (node.tag === "ol") return { type: "ordered_list", items: listItems(node) }
  return null
}

export function parseHtmlToBlocksServer(html: string): ParsedBlock[] {
  if (!html?.trim()) return []
  return parseHtml(html)
    .map(blockOf)
    .filter((block): block is ParsedBlock => block !== null)
}
