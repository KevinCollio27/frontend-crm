"use client"

import * as React from "react"
import {
  BotIcon,
  CheckCircle2Icon,
  ClipboardCopyIcon,
  InfoIcon,
  LoaderCircleIcon,
  PlusIcon,
  ServerIcon,
  Trash2Icon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { confirmDialog } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { aiConnectionService } from "@/services/aiConnection.service"
import type { AiConnection } from "@/types/ai-connection"
import { ASSISTANT_LABEL, CreateConnectionSheet } from "./CreateConnectionSheet"

const MCP_SERVER_URL = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/mcp`

// Las conexiones hechas iniciando sesión desde el asistente no tienen una clave que mostrar.
const OAUTH_KEY_PREFIX = "goxt_oat_"

const GUIDES = [
  {
    value: "claude",
    label: "Claude",
    steps: [
      "Copia la URL del servidor.",
      "En Claude (web o escritorio), abre Configuración → Conectores → Agregar conector personalizado y pega la URL.",
      "Claude abre el CRM: inicia sesión, elige el workspace y presiona Permitir acceso. No necesitas ninguna clave.",
      "Para Claude Code, crea una conexión con Nueva conexión y usa el comando que te entrega.",
    ],
  },
  {
    value: "chatgpt",
    label: "ChatGPT",
    steps: [
      "Copia la URL del servidor.",
      "En ChatGPT, abre Configuración → Conectores y agrega uno nuevo con esa URL.",
      "ChatGPT abre el CRM: inicia sesión, elige el workspace y presiona Permitir acceso.",
    ],
  },
  {
    value: "gemini",
    label: "Gemini",
    steps: [
      "Crea una conexión y copia la clave.",
      "En Gemini CLI, agrega un servidor MCP en el archivo de configuración.",
      "Usa la URL del servidor y la clave como encabezado de autorización.",
    ],
  },
]

function lastUsedLabel(lastUsedAt: string | null): string {
  if (!lastUsedAt) return "sin uso todavía"
  const minutes = Math.floor((Date.now() - new Date(lastUsedAt).getTime()) / 60_000)
  if (minutes < 1) return "usada recién"
  if (minutes < 60) return `usada hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `usada hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `usada hace ${days} ${days === 1 ? "día" : "días"}`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied
        ? <CheckCircle2Icon className="size-4 text-green-600" />
        : <ClipboardCopyIcon className="size-4" />
      }
    </button>
  )
}

export function AiAssistantsPanel() {
  const [connections, setConnections] = React.useState<AiConnection[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const loadConnections = React.useCallback(() => {
    aiConnectionService.all()
      .then(setConnections)
      .catch(() => notify.error({ title: "Algo salió mal", description: "No se pudieron cargar las conexiones." }))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    loadConnections()
  }, [loadConnections])

  async function handleRevoke(connection: AiConnection) {
    const confirmed = await confirmDialog({
      title: `¿Revocar "${connection.name}"?`,
      description: "El asistente dejará de tener acceso al CRM. Para volver a usarlo habrá que conectarlo de nuevo.",
      confirmText: "Sí, revocar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!confirmed) return
    try {
      await aiConnectionService.revoke(connection.id)
      setConnections((prev) => prev.filter((c) => c.id !== connection.id))
      notify.success({ title: "Conexión revocada", description: `"${connection.name}" ya no tiene acceso.` })
    } catch (error) {
      const description = (error as { message?: string })?.message || "No se pudo revocar la conexión."
      notify.error({ title: "Algo salió mal", description })
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950/20">
        <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-purple-700 uppercase dark:text-purple-400">
          <InfoIcon className="size-3" /> Cómo funciona
        </p>
        <p className="text-sm">
          Tu asistente puede buscar, crear y editar registros del CRM y agregar notas. Solo ve los datos de este
          workspace, actúa con tus permisos y no puede eliminar nada. Todo lo que hace queda en el historial a tu nombre.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
              <ServerIcon className="size-5" />
            </div>
            <div>
              <CardTitle>Servidor MCP</CardTitle>
              <CardDescription>
                Pega esta dirección en tu asistente; te pedirá iniciar sesión en el CRM
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-1.5">
          <Label>URL del servidor</Label>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-sm text-muted-foreground">
              {MCP_SERVER_URL}
            </div>
            <CopyButton text={MCP_SERVER_URL} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BotIcon className="size-5" />
              </div>
              <div>
                <CardTitle>Mis conexiones</CardTitle>
                <CardDescription>
                  Cada conexión es personal y actúa a tu nombre
                </CardDescription>
              </div>
            </div>
            <Button type="button" className="gap-2" onClick={() => setSheetOpen(true)}>
              <PlusIcon className="size-4" />
              Nueva conexión
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : connections.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Todavía no tienes conexiones. Conecta tu asistente con la URL del servidor o crea una clave.
            </p>
          ) : (
            <ul className="divide-y">
              {connections.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ASSISTANT_LABEL[c.assistant] ?? c.assistant} ·{" "}
                      {c.key_prefix.startsWith(OAUTH_KEY_PREFIX) ? "inicio de sesión" : <span className="font-mono">{c.key_prefix}…</span>} · {lastUsedLabel(c.last_used_at)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {c.scopes.includes("crm") ? "Lectura y escritura" : "Solo lectura"}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRevoke(c)}
                    aria-label={`Revocar ${c.name}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Cómo conectar</CardTitle>
          <CardDescription>Elige tu asistente y sigue los pasos</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <Tabs defaultValue="claude">
            <TabsList variant="line">
              {GUIDES.map((g) => (
                <TabsTrigger key={g.value} value={g.value}>{g.label}</TabsTrigger>
              ))}
            </TabsList>
            {GUIDES.map((g) => (
              <TabsContent key={g.value} value={g.value} className="pt-4">
                <ol className="space-y-2.5 text-sm">
                  {g.steps.map((step, i) => (
                    <li key={step} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border bg-background text-xs font-medium">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <CreateConnectionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        serverUrl={MCP_SERVER_URL}
        onCreated={loadConnections}
      />
    </div>
  )
}
