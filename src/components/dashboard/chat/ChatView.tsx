"use client"

import * as React from "react"
import {
  CalendarPlusIcon,
  HistoryIcon,
  MicIcon,
  PaperclipIcon,
  UserPlusIcon,
  TrendingUpIcon,
} from "lucide-react"
import {
  IconArrowUp,
  IconCirclePlus,
  IconPaperclip,
  IconPlus,
  IconSparkles,
  IconX,
} from "@tabler/icons-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MarkdownContent } from "@/components/dashboard/MarkdownContent"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type ChatConversation, type ChatMessage, QUICK_ACTIONS } from "./data"

// ─── Shared input bar ─────────────────────────────────────────────────────────

interface AttachedFile {
  id: string
  name: string
  file: File
  preview?: string
}

interface InputBarProps {
  onSubmit: (prompt: string, files: File[]) => void
  autoFocus?: boolean
  disabled?: boolean
}

function InputBar({ onSubmit, autoFocus, disabled = false }: InputBarProps) {
  const [prompt, setPrompt]           = React.useState("")
  const [isDragOver, setIsDragOver]   = React.useState(false)
  const [attached, setAttached]       = React.useState<AttachedFile[]>([])
  const fileInputRef                  = React.useRef<HTMLInputElement>(null)

  const generateId = () => Math.random().toString(36).slice(2, 8)

  const processFiles = (files: File[]) => {
    for (const file of files) {
      const id = generateId()
      const entry: AttachedFile = { id, name: file.name, file }
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = () =>
          setAttached((prev) =>
            prev.map((f) => (f.id === id ? { ...f, preview: reader.result as string } : f))
          )
        reader.readAsDataURL(file)
      }
      setAttached((prev) => [...prev, entry])
    }
  }

  const openFiles = (accept: string) => {
    if (!fileInputRef.current) return
    fileInputRef.current.accept = accept
    fileInputRef.current.click()
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!prompt.trim() && attached.length === 0) return
    onSubmit(prompt.trim(), attached.map((f) => f.file))
    setPrompt("")
    setAttached([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const hasContent = prompt.trim().length > 0 || attached.length > 0

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        processFiles(Array.from(e.dataTransfer.files))
      }}
      className={cn("relative overflow-visible rounded-xl border transition-colors duration-150 focus-within:border-ring p-2", disabled && "opacity-60 pointer-events-none")}
    >
      {/* Drag overlay */}
      <div className={cn(
        "pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] border border-dashed border-border bg-muted text-sm transition-opacity duration-150",
        isDragOver ? "opacity-100" : "opacity-0"
      )}>
        <span className="flex items-center gap-1.5 font-medium">
          <IconCirclePlus size={16} />
          Suelta los archivos aquí
        </span>
      </div>

      {/* Attached files */}
      {attached.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attached.map((file) => (
            <Badge
              key={file.id}
              variant="outline"
              className="group relative h-6 max-w-40 cursor-pointer overflow-hidden px-0 text-[12px] transition-colors hover:bg-accent"
            >
              <span className="flex h-full items-center gap-1.5 overflow-hidden pl-1.5">
                <div className="relative flex size-4 shrink-0 items-center justify-center">
                  {file.preview ? (
                    <Image
                      src={file.preview}
                      alt={file.name}
                      width={16}
                      height={16}
                      className="absolute inset-0 size-4 rounded border object-cover"
                    />
                  ) : (
                    <IconPaperclip size={12} className="opacity-60" />
                  )}
                </div>
                <span className="truncate pr-1">{file.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setAttached((prev) => prev.filter((f) => f.id !== file.id))}
                className="absolute right-1 z-10 rounded-sm p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100"
              >
                <IconX size={11} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Textarea */}
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pregunta lo que quieras..."
        autoFocus={autoFocus}
        className="max-h-48 min-h-11 resize-none rounded-none border-none bg-transparent! p-0 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            processFiles(Array.from(e.target.files ?? []))
            e.target.value = ""
          }}
        />

        {/* + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                className="-ml-0.5 rounded-md"
                aria-label="Adjuntar o crear"
              />
            }
          >
            <IconPlus size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-2xl p-1.5">
            <DropdownMenuGroup className="space-y-0.5">
              <DropdownMenuLabel className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Adjuntar
              </DropdownMenuLabel>
              <DropdownMenuItem className="rounded-md text-xs" onClick={() => openFiles("image/*")}>
                <PaperclipIcon className="size-3.5 text-muted-foreground" />
                Imagen
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-md text-xs" onClick={() => openFiles("*")}>
                <PaperclipIcon className="size-3.5 text-muted-foreground" />
                Archivo
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup className="space-y-0.5">
              <DropdownMenuLabel className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Crear en CRM
              </DropdownMenuLabel>
              <DropdownMenuItem className="rounded-md text-xs">
                <UserPlusIcon className="size-3.5 text-muted-foreground" />
                Contacto
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-md text-xs">
                <TrendingUpIcon className="size-3.5 text-muted-foreground" />
                Oportunidad
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-md text-xs">
                <CalendarPlusIcon className="size-3.5 text-muted-foreground" />
                Actividad
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Send / Mic */}
        <div className="ml-auto">
          {hasContent ? (
            <Button size="icon-sm" type="submit" className="rounded-full" aria-label="Enviar">
              <IconArrowUp size={15} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" type="button" className="rounded-md text-muted-foreground" aria-label="Voz">
              <MicIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

// ─── Message bubbles ──────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {content}
      </div>
    </div>
  )
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/40">
        <IconSparkles size={14} className="text-violet-600" />
      </div>
      <div className="flex-1 pt-0.5 text-sm leading-relaxed text-foreground">
        <MarkdownContent content={content} />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ChatViewProps {
  conversation: ChatConversation | undefined
  onSubmit: (prompt: string, files: File[]) => void
  sending?: boolean
  onOpenHistory?: () => void
}

function HistoryBar({ onOpenHistory }: { onOpenHistory?: () => void }) {
  if (!onOpenHistory) return null
  return (
    <div className="flex shrink-0 items-center border-b px-4 py-2 md:hidden">
      <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onOpenHistory}>
        <HistoryIcon className="size-3.5" />
        Historial
      </Button>
    </div>
  )
}

export function ChatView({ conversation, onSubmit, sending = false, onOpenHistory }: ChatViewProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages.length, sending])

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!conversation) {
    return (
      <div className="flex h-full flex-col">
      <HistoryBar onOpenHistory={onOpenHistory} />
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">

          <div className="text-center animate-[fade-blur_1.2s_ease-out_both]">
            <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight">
              ¿En qué puedo apoyarte hoy?
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground animate-[fade-up_0.4s_ease-out_both]" style={{ animationDelay: "80ms" }}>
              Gestiona tu CRM, encuentra oportunidades y toma mejores decisiones.
            </p>
          </div>

          <div
            className="w-full animate-[fade-up_0.4s_ease-out_both]"
            style={{ animationDelay: "100ms" }}
          >
            <InputBar onSubmit={onSubmit} autoFocus disabled={sending} />
          </div>

          <div
            className="flex flex-wrap justify-center gap-2 animate-[fade-up_0.4s_ease-out_both]"
            style={{ animationDelay: "200ms" }}
          >
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="gap-2 rounded-full"
                onClick={() => onSubmit(action.prompt, [])}
              >
                <action.icon size={14} />
                {action.label}
              </Button>
            ))}
          </div>

        </div>
      </div>
      </div>
    )
  }

  // ── Active chat ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      <HistoryBar onOpenHistory={onOpenHistory} />
      <div className="flex-1 overflow-y-auto px-4 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {conversation.messages.map((msg) =>
            msg.role === "user" ? (
              <UserBubble key={msg.id} content={msg.content} />
            ) : (
              <AssistantBubble key={msg.id} content={msg.content} />
            )
          )}
          {sending && (
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/40">
                <IconSparkles size={14} className="text-violet-600" />
              </div>
              <div className="flex gap-1 pt-3">
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4">
        <div className="mx-auto max-w-2xl">
          <InputBar onSubmit={onSubmit} disabled={sending} />
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            El Agente de IA puede cometer errores. Verifica la información importante.
          </p>
        </div>
      </div>
    </div>
  )
}
