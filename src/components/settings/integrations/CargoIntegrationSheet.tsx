"use client"

import * as React from "react"
import { CheckCircle2Icon, EyeIcon, EyeOffIcon, LoaderCircleIcon, PencilIcon, XCircleIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { integrationConfirm } from "@/lib/confirm"
import { integrationNotify } from "@/lib/notify"
import { integrationService } from "@/services/integration.service"
import type { WorkspaceIntegrationRaw } from "@/types/integration"

const DEFAULT_API_URL = "https://api-cargo.goxt.io/api/"

interface CargoIntegrationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection?: WorkspaceIntegrationRaw
  onSuccess: () => void
}

export function CargoIntegrationSheet({ open, onOpenChange, connection, onSuccess }: CargoIntegrationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 460, padding: 0, gap: 0 }}
        className="w-full!"
      >
        {open && (
          <CargoForm connection={connection} onClose={() => onOpenChange(false)} onSuccess={onSuccess} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function errorMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message ?? fallback
}

function CargoForm({
  connection,
  onClose,
  onSuccess,
}: {
  connection?: WorkspaceIntegrationRaw
  onClose: () => void
  onSuccess: () => void
}) {
  const isConnected = !!connection
  const [apiUrl, setApiUrl] = React.useState(DEFAULT_API_URL)
  const [urlLocked, setUrlLocked] = React.useState(true)
  const [token, setToken] = React.useState("")
  // El backend nunca devuelve el token guardado (igual que una contraseña) — si ya está
  // conectado, el campo arranca bloqueado con un placeholder enmascarado en vez de vacío
  // editable, y hay que pulsar "Cambiar" para reemplazarlo.
  const [tokenLocked, setTokenLocked] = React.useState(isConnected)
  const [showToken, setShowToken] = React.useState(false)
  const [accountName, setAccountName] = React.useState(connection?.account_name ?? "")
  const [testResult, setTestResult] = React.useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [disconnecting, setDisconnecting] = React.useState(false)

  async function handleTest() {
    if (tokenLocked) {
      integrationNotify.error("Pulsa \"Cambiar\" para ingresar un token nuevo antes de probar.")
      return
    }
    if (!token.trim()) {
      integrationNotify.error("Ingresa el token del workspace primero.")
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const result = await integrationService.testCargoConnection({ apiUrl, workspaceToken: token.trim() })
      setTestResult(result)
    } finally {
      setTesting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tokenLocked) {
      integrationNotify.error("Pulsa \"Cambiar\" para ingresar un token nuevo.")
      return
    }
    if (!token.trim()) {
      integrationNotify.error("Falta el token del workspace.")
      return
    }
    setSubmitting(true)
    try {
      await integrationService.connectCargo({
        apiUrl,
        workspaceToken: token.trim(),
        accountName: accountName.trim() || undefined,
      })
      integrationNotify.connected("Cargo")
      onSuccess()
      onClose()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo conectar con Cargo."))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDisconnect() {
    if (!connection) return
    const confirmed = await integrationConfirm.disconnect("Cargo")
    if (!confirmed) return
    setDisconnecting(true)
    try {
      await integrationService.disconnect(connection.id)
      integrationNotify.disconnected("Cargo")
      onSuccess()
      onClose()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo desconectar Cargo."))
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle>Configuración de Cargo</SheetTitle>
          <SheetDescription>Configura los parámetros de conexión con la API de Cargo.</SheetDescription>
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
        {isConnected && (
          <div className="m-5 mb-0 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2Icon className="size-3.5 shrink-0" />
            Conectado{connection?.account_name ? ` como "${connection.account_name}"` : ""}. El token no se vuelve a mostrar por seguridad — pulsa &quot;Cambiar&quot; para reemplazarlo, o desconéctalo abajo.
          </div>
        )}

        <form id="cargo-integration-form" onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>URL de API</Label>
              {urlLocked && (
                <button
                  type="button"
                  onClick={() => setUrlLocked(false)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <PencilIcon className="size-3" /> Editar
                </button>
              )}
            </div>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              disabled={urlLocked}
              className="font-mono text-sm"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Token de Workspace <span className="text-destructive">*</span>
              </Label>
              {tokenLocked && (
                <button
                  type="button"
                  onClick={() => setTokenLocked(false)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <PencilIcon className="size-3" /> Cambiar
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                value={tokenLocked ? "" : token}
                onChange={(e) => { setToken(e.target.value); setTestResult(null) }}
                placeholder={tokenLocked ? "•••••••••••••••• (token guardado)" : "••••••••••••••••"}
                disabled={tokenLocked}
                className="pr-10 font-mono"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                disabled={tokenLocked}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-40"
                aria-label={showToken ? "Ocultar token" : "Mostrar token"}
              >
                {showToken ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nombre de la Cuenta (Opcional)</Label>
            <Input
              placeholder="ej. Conexion Southway"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Para identificar con qué workspace de Cargo te conectaste.
            </p>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={testing || tokenLocked || !token.trim()}>
            {testing && <LoaderCircleIcon className="size-3.5 animate-spin" />}
            Probar Conexión
          </Button>

          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
                testResult.ok
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {testResult.ok ? <CheckCircle2Icon className="size-3.5 shrink-0" /> : <XCircleIcon className="size-3.5 shrink-0" />}
              {testResult.message}
            </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t p-4">
        {isConnected ? (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
            Desconectar
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="cargo-integration-form" disabled={submitting || tokenLocked}>
            {submitting && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
            {isConnected ? "Reconectar" : "Conectar"}
          </Button>
        </div>
      </div>
    </>
  )
}
