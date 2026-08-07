"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, LoaderCircleIcon, SparklesIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { integrationConfirm } from "@/lib/confirm"
import { integrationNotify } from "@/lib/notify"
import { AI_SUGGESTIONS_ALLOWED_WORKSPACE_IDS } from "@/lib/ai-suggestions-config"
import { integrationService } from "@/services/integration.service"
import { workspaceService } from "@/services/workspace.service"
import { useSessionStore } from "@/store/session.store"
import type { WorkspaceIntegrationRaw } from "@/types/integration"

interface AiSuggestionsActivationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection?: WorkspaceIntegrationRaw
  onSuccess: () => void
}

export function AiSuggestionsActivationSheet({ open, onOpenChange, connection, onSuccess }: AiSuggestionsActivationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 460, padding: 0, gap: 0 }}
        className="w-full"
      >
        {open && (
          <AiSuggestionsForm connection={connection} onClose={() => onOpenChange(false)} onSuccess={onSuccess} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function errorMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message ?? fallback
}

function AiSuggestionsForm({
  connection,
  onClose,
  onSuccess,
}: {
  connection?: WorkspaceIntegrationRaw
  onClose: () => void
  onSuccess: () => void
}) {
  const router = useRouter()
  const isActive = !!connection
  const workspaceId = useSessionStore((s) => s.workspaceId)
  const isAllowedWorkspace = workspaceId != null && AI_SUGGESTIONS_ALLOWED_WORKSPACE_IDS.includes(workspaceId)
  const [loadingProfile, setLoadingProfile] = React.useState(true)
  const [gateComplete, setGateComplete] = React.useState(false)
  const [activating, setActivating] = React.useState(false)
  const [deactivating, setDeactivating] = React.useState(false)

  React.useEffect(() => {
    workspaceService
      .get()
      .then((ws) => {
        setGateComplete(!!ws.business_description?.trim() && !!ws.objective?.trim())
      })
      .catch(() => setGateComplete(false))
      .finally(() => setLoadingProfile(false))
  }, [])

  async function handleActivate() {
    setActivating(true)
    try {
      await integrationService.connectAiSuggestions()
      integrationNotify.connected("Sugerencias IA")
      onSuccess()
      onClose()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo activar Sugerencias IA."))
    } finally {
      setActivating(false)
    }
  }

  async function handleDeactivate() {
    if (!connection) return
    const confirmed = await integrationConfirm.disconnect("Sugerencias IA")
    if (!confirmed) return
    setDeactivating(true)
    try {
      await integrationService.disconnect(connection.id)
      integrationNotify.disconnected("Sugerencias IA")
      onSuccess()
      onClose()
    } catch (error) {
      integrationNotify.error(errorMessage(error, "No se pudo desactivar Sugerencias IA."))
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b p-5">
        <div className="space-y-0.5">
          <SheetTitle className="flex items-center gap-1.5">
            <SparklesIcon className="size-4 text-muted-foreground" /> Sugerencias IA
          </SheetTitle>
          <SheetDescription>Seguimiento comercial asistido — detecta oportunidades sin movimiento y sugiere la próxima acción.</SheetDescription>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose} aria-label="Cerrar">
          <XIcon />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {isActive ? (
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Activo para todo el workspace — cualquier miembro puede ver y aplicar las sugerencias. Cada acción
              (correo, evento) se ejecuta con la cuenta personal de quien la aplica.
            </span>
          </div>
        ) : !isAllowedWorkspace ? (
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Sugerencias IA todavía está en prueba interna y no está disponible para este workspace. Se irá
              abriendo de a poco.
            </span>
          </div>
        ) : loadingProfile ? (
          <p className="text-sm text-muted-foreground">Revisando el perfil del workspace...</p>
        ) : !gateComplete ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
              <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Antes de activar, completa la <strong>descripción del negocio</strong> y el{" "}
                <strong>objetivo comercial</strong> de tu workspace — sin eso la IA no tiene contexto suficiente
                para redactar sugerencias útiles.
              </span>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/settings/workspace")}>
              Ir a completar el perfil del workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Detecta oportunidades sin seguimiento (sin contacto, cotizaciones sin respuesta, tareas vencidas,
              etapas sin cerrar) y sugiere una acción concreta — correo, llamada, o actualizar el estado. Vos
              decidís, la IA solo propone.
            </p>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              Usamos el nombre, rubro, descripción y objetivo de tu workspace para darle contexto a la IA y que
              las recomendaciones tengan sentido para tu negocio — no se comparte con nadie fuera de tu equipo.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t p-4">
        {isActive ? (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDeactivate} disabled={deactivating}>
            {deactivating && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
            Desactivar
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {isActive ? "Cerrar" : "Cancelar"}
          </Button>
          {!isActive && isAllowedWorkspace && (
            <Button type="button" onClick={handleActivate} disabled={activating || loadingProfile || !gateComplete}>
              {activating && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
              Activar
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
