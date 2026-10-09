"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftRightIcon, BotIcon, CheckIcon, Loader2Icon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WorkspaceLogo } from "@/components/shared/WorkspaceLogo"
import { notify } from "@/lib/notify"
import { savePostLoginRedirect } from "@/lib/post-login-redirect"
import { oauthService, type OAuthClientInfo, type OAuthRequest } from "@/services/oauth.service"
import type { User } from "@/types/auth"

type Status = "loading" | "ready" | "invalid"

const CAN_READ = "Buscar y leer contactos, organizaciones, oportunidades, actividades, cotizaciones, blog y campañas"
const CAN_WRITE = "Crear y editar registros, agregar notas y enviar cotizaciones y campañas"

interface Props {
  request: OAuthRequest
  // La dirección que se pegó en el asistente es la de un workspace: no se puede elegir otro.
  lockedWorkspaceId: number | null
}

export function OAuthConsentView({ request, lockedWorkspaceId }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [client, setClient] = useState<OAuthClientInfo | null>(null)
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [canWrite, setCanWrite] = useState(true)
  const [submitting, setSubmitting] = useState<"allow" | "deny" | null>(null)

  const asksWrite = request.scope.split(/\s+/).includes("crm")
  const workspaces = (user?.user_workspace ?? []).filter((w) => w.is_active && w.workspace)

  useEffect(() => {
    async function load() {
      if (!request.client_id || !request.redirect_uri || !request.code_challenge) {
        setErrorMessage("Faltan datos en la solicitud de conexión.")
        setStatus("invalid")
        return
      }

      const session = await fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ user: null }))
      if (!session.user) {
        // Sin sesión: el login vuelve a esta misma solicitud al terminar.
        savePostLoginRedirect(window.location.pathname + window.location.search)
        router.replace("/login")
        return
      }

      try {
        setClient(await oauthService.client(request))
      } catch (error) {
        setErrorMessage((error as { message?: string })?.message || "La solicitud de conexión no es válida.")
        setStatus("invalid")
        return
      }

      const sessionUser = session.user as User
      const active = (sessionUser.user_workspace ?? []).filter((w) => w.is_active && w.workspace)
      if (lockedWorkspaceId && !active.some((w) => w.workspace_id === lockedWorkspaceId)) {
        setErrorMessage(`La dirección que usaste es de un workspace al que ${sessionUser.email} no pertenece. Copia la dirección desde Asistentes de IA en tu workspace.`)
        setStatus("invalid")
        return
      }
      setUser(sessionUser)
      setWorkspaceId(
        lockedWorkspaceId ??active.find((w) => w.workspace_id === session.workspaceId)?.workspace_id ?? active[0]?.workspace_id ?? null)
      setStatus("ready")
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function decide(approved: boolean) {
    if (approved && !workspaceId) return
    setSubmitting(approved ? "allow" : "deny")
    try {
      const redirectTo = await oauthService.decide(request, {
        approved,
        workspace_id: workspaceId ?? undefined,
        can_write: asksWrite && canWrite,
      })
      window.location.assign(redirectTo)
    } catch (error) {
      const description = (error as { message?: string })?.message || "No se pudo completar la conexión."
      notify.error({ title: "Algo salió mal", description })
      setSubmitting(null)
    }
  }

  const selected = workspaces.find((w) => w.workspace_id === workspaceId)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border bg-card px-8 py-8 shadow-2xl/5">
        {status === "loading" && (
          <div className="flex justify-center py-10">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-3 py-4 text-center">
            <TriangleAlertIcon className="mx-auto size-8 text-destructive" />
            <h1 className="text-lg font-semibold">No se puede conectar</h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">Vuelve a tu asistente e inicia la conexión de nuevo.</p>
          </div>
        )}

        {status === "ready" && client && user && (
          <div className="space-y-6">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
                  <BotIcon className="size-6" />
                </div>
                <ArrowLeftRightIcon className="size-4 text-muted-foreground" />
                <WorkspaceLogo name={selected?.workspace?.name ?? "GOXT"} logo={selected?.workspace?.logo} className="size-12! border" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold">{client.name} quiere conectarse a tu CRM</h1>
                <p className="text-sm text-muted-foreground">
                  Sesión iniciada como {user.name} ({user.email})
                </p>
              </div>
            </div>

            {workspaces.length === 0 ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                Tu cuenta no pertenece a ningún workspace activo, así que no hay nada a lo que conectar.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="oauth-workspace">Workspace</Label>
                  {workspaces.length === 1 || lockedWorkspaceId ? (
                    <div className="rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm">{selected?.workspace?.name}</div>
                  ) : (
                    <Select value={workspaceId ? String(workspaceId) : ""} onValueChange={(v) => setWorkspaceId(Number(v))}>
                      <SelectTrigger id="oauth-workspace" className="w-full">
                        <SelectValue>
                          {(v: string) =>
                            v ? (workspaces.find((w) => String(w.workspace_id) === v)?.workspace?.name ?? v) : "Selecciona un workspace"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {workspaces.map((w) => (
                          <SelectItem key={w.workspace_id} value={String(w.workspace_id)}>
                            {w.workspace?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">El asistente solo verá los datos de este workspace.</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Podrá, con tus mismos permisos:</p>
                  <div className="flex items-start gap-2.5 text-sm">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <span>{CAN_READ}</span>
                  </div>
                  {asksWrite && (
                    <div className="flex items-start gap-2.5 text-sm">
                      <Checkbox id="oauth-write" className="mt-0.5" checked={canWrite} onCheckedChange={(v) => setCanWrite(!!v)} />
                      <Label htmlFor="oauth-write" className="cursor-pointer text-sm leading-normal font-normal">
                        {CAN_WRITE}
                      </Label>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950/20">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-purple-700 uppercase dark:text-purple-400">
                    <ShieldCheckIcon className="size-3" /> Tú mantienes el control
                  </p>
                  <p className="text-sm">
                    No puede eliminar registros y todo lo que haga queda en el historial a tu nombre. Puedes desconectarlo
                    cuando quieras en Configuración → Asistentes de IA.
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" disabled={!!submitting} onClick={() => decide(false)}>
                  {submitting === "deny" && <Loader2Icon className="size-4 animate-spin" />}
                  Cancelar
                </Button>
                <Button type="button" className="flex-1" disabled={!!submitting || !workspaceId} onClick={() => decide(true)}>
                  {submitting === "allow" && <Loader2Icon className="size-4 animate-spin" />}
                  Permitir acceso
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">Al continuar volverás a {client.redirect_host}.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
