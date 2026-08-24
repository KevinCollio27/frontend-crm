"use client"

import * as React from "react"
import {
  HistoryIcon,
  ImagePlusIcon,
  LoaderCircleIcon,
  MicIcon,
  SquareIcon,
} from "lucide-react"
import {
  IconArrowUp,
  IconCirclePlus,
  IconPaperclip,
  IconSparkles,
  IconX,
} from "@tabler/icons-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MarkdownContent } from "@/components/dashboard/MarkdownContent"
import { useSessionStore } from "@/store/session.store"
import { notify } from "@/lib/notify"
import { aiAudioService } from "@/services/ai-audio.service"
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
  const [isRecording, setIsRecording]     = React.useState(false)
  const [isTranscribing, setIsTranscribing] = React.useState(false)
  const [elapsedSec, setElapsedSec]       = React.useState(0)
  const fileInputRef                  = React.useRef<HTMLInputElement>(null)
  const mediaRecorderRef              = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef                = React.useRef<Blob[]>([])
  const audioContextRef               = React.useRef<AudioContext | null>(null)
  const analyserRef                   = React.useRef<AnalyserNode | null>(null)
  const rafIdRef                      = React.useRef<number | null>(null)
  const timerIdRef                    = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const barRefs                       = React.useRef<(HTMLDivElement | null)[]>([])

  const BAR_COUNT = 28

  const generateId = () => Math.random().toString(36).slice(2, 8)

  function formatElapsed(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0")
    const s = (sec % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  function animateWaveform() {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(data)
    const chunkSize = Math.max(1, Math.floor(data.length / BAR_COUNT))
    for (let i = 0; i < BAR_COUNT; i++) {
      const start = i * chunkSize
      let sumSquares = 0
      for (let j = start; j < start + chunkSize; j++) {
        const v = (data[j] - 128) / 128
        sumSquares += v * v
      }
      const rms = Math.sqrt(sumSquares / chunkSize)
      const boosted = Math.min(1, rms * 5)
      const height = 4 + boosted * 32
      const el = barRefs.current[i]
      if (el) el.style.height = `${height}px`
    }
    rafIdRef.current = requestAnimationFrame(animateWaveform)
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())

        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
        audioContextRef.current?.close().catch(() => {})
        audioContextRef.current = null
        analyserRef.current = null
        if (timerIdRef.current) clearInterval(timerIdRef.current)
        timerIdRef.current = null
        setElapsedSec(0)

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        if (blob.size === 0) return

        setIsTranscribing(true)
        try {
          const base64 = await blobToBase64(blob)
          const text = await aiAudioService.transcribe(base64)
          if (text?.trim()) {
            setPrompt((prev) => (prev.trim() ? `${prev.trim()} ${text.trim()}` : text.trim()))
          }
        } catch {
          notify.error({ title: "No se pudo transcribir el audio", description: "Intenta grabar de nuevo." })
        } finally {
          setIsTranscribing(false)
        }
      }

      // Análisis de audio en vivo para las ondas — no crítico, si falla la grabación sigue igual.
      try {
        const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioCtx = new AudioContextCtor()
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        audioContextRef.current = audioCtx
        analyserRef.current = analyser
        rafIdRef.current = requestAnimationFrame(animateWaveform)
      } catch {
        // sin ondas animadas, pero la grabación sigue funcionando
      }

      timerIdRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000)

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      notify.error({ title: "No se pudo acceder al micrófono", description: "Revisa los permisos del navegador." })
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  function toggleRecording() {
    if (isRecording) stopRecording()
    else startRecording()
  }

  // Si el componente se desmonta a mitad de una grabación, liberar mic/timer/audio context.
  React.useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      if (timerIdRef.current) clearInterval(timerIdRef.current)
      audioContextRef.current?.close().catch(() => {})
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

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

      {/* Textarea / grabación */}
      {isRecording ? (
        <div className="flex h-11 items-center gap-3">
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-destructive">
            <span className="size-2 rounded-full bg-destructive animate-pulse" />
            {formatElapsed(elapsedSec)}
          </span>
          <div className="flex h-full flex-1 items-center justify-center gap-0.75 overflow-hidden">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <div
                key={i}
                ref={(el) => { barRefs.current[i] = el }}
                className="w-0.75 shrink-0 rounded-full bg-destructive/60"
                style={{ height: 4 }}
              />
            ))}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">Intenta hablarnos...</span>
        </div>
      ) : (
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta lo que quieras..."
          autoFocus={autoFocus}
          className="max-h-48 min-h-11 resize-none rounded-none border-none bg-transparent! p-0 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0"
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            processFiles(Array.from(e.target.files ?? []))
            e.target.value = ""
          }}
        />

        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          className="-ml-0.5 rounded-md text-muted-foreground"
          aria-label="Adjuntar imagen"
          onClick={() => openFiles("image/*")}
        >
          <ImagePlusIcon className="size-4" />
        </Button>

        {/* Send / Mic */}
        <div className="ml-auto">
          {hasContent ? (
            <Button size="icon-sm" type="submit" className="rounded-full" aria-label="Enviar">
              <IconArrowUp size={15} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              className={cn("rounded-md", isRecording ? "text-destructive" : "text-muted-foreground")}
              aria-label={isRecording ? "Detener grabación" : "Grabar audio"}
              onClick={toggleRecording}
              disabled={disabled || isTranscribing}
            >
              {isTranscribing ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : isRecording ? (
                <SquareIcon className="size-4 fill-current" />
              ) : (
                <MicIcon className="size-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

// ─── Message bubbles ──────────────────────────────────────────────────────────

function UserBubble({ content, images }: { content: string; images?: string[] }) {
  const user = useSessionStore((s) => s.user)
  const initials = (user?.name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const hasImages = images && images.length > 0

  return (
    <div className="flex items-end justify-end gap-3">
      <div className="max-w-[75%] overflow-hidden rounded-2xl rounded-br-sm bg-primary text-primary-foreground">
        {hasImages && (
          <div className={cn("grid gap-1 p-1", images!.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {images!.map((src, i) => (
              <Image
                key={i}
                src={src}
                alt="Imagen adjunta"
                width={240}
                height={240}
                unoptimized
                className="aspect-square w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        {content && <div className="px-4 py-2.5 text-sm">{content}</div>}
      </div>
      <Avatar className="size-7 shrink-0">
        <AvatarImage src={user?.avatar_url || "https://github.com/shadcn.png"} alt={user?.name ?? ""} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
    </div>
  )
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/40">
        <IconSparkles size={14} className="text-violet-600 dark:text-violet-400" />
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
              <UserBubble key={msg.id} content={msg.content} images={msg.images} />
            ) : (
              <AssistantBubble key={msg.id} content={msg.content} />
            )
          )}
          {sending && (
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/40">
                <IconSparkles size={14} className="text-violet-600 dark:text-violet-400" />
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
