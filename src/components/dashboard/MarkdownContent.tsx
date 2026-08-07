"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

// Respuestas de IA vienen como texto con sintaxis markdown (**negrita**, listas,
// etc.) — esto las renderiza a elementos reales en vez de mostrar los símbolos
// crudos. El estilo vive en .markdown-content (globals.css), pensado para caber
// dentro de una burbuja de chat angosta.
export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
