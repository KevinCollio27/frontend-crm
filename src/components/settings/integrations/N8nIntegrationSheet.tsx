"use client"

import * as React from "react"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

export interface N8nFormValues {
  webhookUrl: string
  apiKey: string
}

interface N8nIntegrationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: () => void
}

export function N8nIntegrationSheet({ open, onOpenChange, onConnected }: N8nIntegrationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 460, padding: 0, gap: 0 }}
        className="w-full"
      >
        {open && <N8nForm onClose={() => onOpenChange(false)} onConnected={onConnected} />}
      </SheetContent>
    </Sheet>
  )
}

function N8nForm({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [webhookUrl, setWebhookUrl] = React.useState("")
  const [apiKey, setApiKey] = React.useState("")
  const [showApiKey, setShowApiKey] = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!webhookUrl.trim()) {
      toast.error("Falta la URL del webhook")
      return
    }
    const values: N8nFormValues = { webhookUrl: webhookUrl.trim(), apiKey: apiKey.trim() }
    console.log(values)
    toast.success("n8n conectado")
    onConnected()
    onClose()
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>Configuración de n8n</SheetTitle>
          <SheetDescription>Conecta tus flujos de automatización de n8n.</SheetDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <XIcon />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <form id="n8n-integration-form" onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="URL del Webhook Principal" required>
            <Input
              placeholder="https://n8n.tu-dominio.up.railway.app/webhook/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="font-mono text-sm"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              La URL de tu instancia de n8n desplegada en Railway.
            </p>
          </Field>

          <Field label="API Key (Opcional)">
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="pr-10 font-mono"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showApiKey ? "Ocultar API Key" : "Mostrar API Key"}
              >
                {showApiKey ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </Field>
        </form>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t p-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" form="n8n-integration-form">
          Conectar
        </Button>
      </div>
    </>
  )
}
