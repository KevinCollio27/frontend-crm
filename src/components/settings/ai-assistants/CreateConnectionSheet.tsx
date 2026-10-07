"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  CheckCircle2Icon,
  ClipboardCopyIcon,
  EyeIcon,
  Loader2Icon,
  PencilIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { aiConnectionService } from "@/services/aiConnection.service"
import type { AiAssistant } from "@/types/ai-connection"

export const ASSISTANT_LABEL: Record<AiAssistant, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  other: "Otro",
}

const ACCESS_OPTIONS = [
  {
    canWrite: false,
    icon: EyeIcon,
    title: "Solo lectura",
    description: "Busca y consulta registros. No puede crear ni modificar nada.",
  },
  {
    canWrite: true,
    icon: PencilIcon,
    title: "Lectura y escritura",
    description: "Además crea y edita registros, y agrega notas. No puede eliminar.",
  },
]

const schema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre a la conexión").max(100, "Máximo 100 caracteres"),
  assistant: z.enum(["claude", "chatgpt", "gemini", "other"]),
  can_write: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface CreateConnectionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverUrl: string
  onCreated: () => void
}

export function CreateConnectionSheet({ open, onOpenChange, serverUrl, onCreated }: CreateConnectionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 480, padding: 0, gap: 0 }}
        className="w-full!"
      >
        {open && <CreateConnection serverUrl={serverUrl} onClose={() => onOpenChange(false)} onCreated={onCreated} />}
      </SheetContent>
    </Sheet>
  )
}

function CreateConnection({ serverUrl, onClose, onCreated }: { serverUrl: string; onClose: () => void; onCreated: () => void }) {
  const [created, setCreated] = React.useState<{ key: string; assistant: AiAssistant } | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", assistant: "claude", can_write: true },
  })
  const { errors, isSubmitting } = form.formState
  const assistant = form.watch("assistant")
  const canWrite = form.watch("can_write")

  async function onSubmit(values: FormValues) {
    try {
      const { key } = await aiConnectionService.create(values)
      setCreated({ key, assistant: values.assistant })
      onCreated()
    } catch (error) {
      const description = (error as { message?: string })?.message || "No se pudo crear la conexión."
      notify.error({ title: "Algo salió mal", description })
    }
  }

  return (
    <>
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>{created ? "Conexión creada" : "Nueva conexión"}</SheetTitle>
          <SheetDescription>
            {created
              ? "Copia la clave y pégala en tu asistente."
              : "Genera una clave para que tu asistente trabaje con el CRM a tu nombre."}
          </SheetDescription>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
          <XIcon />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {created ? (
          <CreatedKey serverUrl={serverUrl} connectionKey={created.key} assistant={created.assistant} />
        ) : (
          <form id="create-connection-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="connection-name">Nombre</Label>
              <Input
                id="connection-name"
                placeholder="Ej: Claude Code · portátil"
                autoFocus
                {...form.register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Asistente</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(ASSISTANT_LABEL) as AiAssistant[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => form.setValue("assistant", value)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                      assistant === value
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-input text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {ASSISTANT_LABEL[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Acceso</Label>
              <div className="space-y-2">
                {ACCESS_OPTIONS.map((option) => (
                  <button
                    key={option.title}
                    type="button"
                    onClick={() => form.setValue("can_write", option.canWrite)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      canWrite === option.canWrite ? "border-primary bg-primary/5" : "border-input hover:bg-muted"
                    )}
                  >
                    <option.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{option.title}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                El asistente solo ve los datos de este workspace y actúa con tus permisos.
              </p>
            </div>
          </form>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t p-4">
        {created ? (
          <Button type="button" onClick={onClose}>Listo</Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" form="create-connection-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              Crear conexión
            </Button>
          </>
        )}
      </div>
    </>
  )
}

function CreatedKey({ serverUrl, connectionKey, assistant }: { serverUrl: string; connectionKey: string; assistant: AiAssistant }) {
  const claudeCommand = `claude mcp add --transport http goxt ${serverUrl} --header "Authorization: Bearer ${connectionKey}"`
  const mcpJson = JSON.stringify(
    { mcpServers: { goxt: { type: "http", url: serverUrl, headers: { Authorization: `Bearer ${connectionKey}` } } } },
    null,
    2
  )

  return (
    <div className="space-y-5 p-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
        <p className="flex items-start gap-2 text-sm">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          Esta clave se muestra una sola vez. Si la pierdes, revoca la conexión y crea otra.
        </p>
      </div>

      <CopyField label="Clave" value={connectionKey} />
      <CopyField label="URL del servidor" value={serverUrl} />

      {assistant === "claude" ? (
        <>
          <div className="space-y-1.5">
            <CopyField label="Claude Code en VS Code" value={mcpJson} pre />
            <p className="text-xs text-muted-foreground">
              Guárdalo como <span className="font-mono">.mcp.json</span> en la raíz de tu proyecto, agrégalo a{" "}
              <span className="font-mono">.gitignore</span> y abre una conversación nueva.
            </p>
          </div>
          <div className="space-y-1.5">
            <CopyField label="Claude Code en la terminal" value={claudeCommand} />
            <p className="text-xs text-muted-foreground">
              Pégalo en tu terminal y abre una sesión nueva de Claude Code.
            </p>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          En tu asistente, agrega un servidor MCP con esta URL y envía la clave en el encabezado{" "}
          <span className="font-mono">Authorization: Bearer</span>.
        </p>
      )}
    </div>
  )
}

function CopyField({ label, value, pre }: { label: string; value: string; pre?: boolean }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div
          className={cn(
            "min-w-0 flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-xs break-all text-muted-foreground",
            pre && "whitespace-pre-wrap"
          )}
        >
          {value}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copiar ${label}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <CheckCircle2Icon className="size-4 text-green-600" /> : <ClipboardCopyIcon className="size-4" />}
        </button>
      </div>
    </div>
  )
}
