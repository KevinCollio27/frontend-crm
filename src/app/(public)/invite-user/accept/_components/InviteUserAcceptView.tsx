"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Loader2Icon, MailWarningIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WorkspaceLogo } from "@/components/shared/WorkspaceLogo"
import { authService } from "@/services/auth.service"
import { notify } from "@/lib/notify"
import { passwordFieldSchema } from "@/lib/password-rules"

const registerSchema = z
  .object({
    name: z.string().min(2, "Mínimo 2 caracteres"),
    password: passwordFieldSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  })

type RegisterValues = z.infer<typeof registerSchema>
type Status = "loading" | "joined" | "needsAccount" | "invalid"

function formatExpiry(expireAt: string): string {
  const days = Math.ceil((new Date(expireAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return "Esta invitación expira hoy."
  if (days === 1) return "Esta invitación expira en 1 día."
  return `Esta invitación expira en ${days} días.`
}

interface Props {
  token: string
  email: string
}

export function InviteUserAcceptView({ token, email }: Props) {
  const router = useRouter()

  const [status, setStatus] = useState<Status>("loading")
  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceLogo, setWorkspaceLogo] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [expireAt, setExpireAt] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const hasRequestedRef = useRef(false)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", password: "", confirm: "" },
  })

  useEffect(() => {
    if (!token || !email) {
      router.replace("/login")
      return
    }
    // El token de invitación es de un solo uso — evita que React Strict Mode
    // (que en dev invoca los efectos dos veces) dispare la aceptación dos veces.
    if (hasRequestedRef.current) return
    hasRequestedRef.current = true

    authService
      .acceptInviteUserToWorkspace(token, email)
      .then((data) => {
        setWorkspaceName(data.workspace?.name ?? "")
        setWorkspaceLogo(data.workspace?.logo ?? null)
        setWorkspaceId(data.workspace?.id ?? null)
        setExpireAt(data.expireAt ?? null)
        if (data.success && data.user) {
          setStatus("joined")
        } else if (data.success && !data.user) {
          setStatus("needsAccount")
        } else {
          setErrorMessage(data.message ?? "")
          setStatus("invalid")
        }
      })
      .catch(() => setStatus("invalid"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: RegisterValues) {
    if (!email || !workspaceId) return
    setSubmitting(true)
    try {
      const registerRes = await authService.register(values.name, email, values.password, undefined, workspaceId)
      if (!registerRes.success) {
        notify.error({ title: "No se pudo crear la cuenta", description: registerRes.message ?? "Intenta de nuevo." })
        setSubmitting(false)
        return
      }
      const loginRes = await authService.login(email, values.password)
      if (loginRes.success) {
        router.replace("/chat")
      } else {
        notify.error({ title: "Cuenta creada", description: "Inicia sesión manualmente." })
        router.replace("/login")
      }
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo completar el registro." })
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card px-8 py-10 shadow-2xl/5">
        {status === "loading" && (
          <div className="flex justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "joined" && (
          <div className="space-y-5 text-center">
            <WorkspaceLogo name={workspaceName} logo={workspaceLogo} size="lg" className="mx-auto rounded-2xl" />
            <div className="space-y-1.5">
              <p className="text-lg font-medium">¡Listo! 🎉</p>
              <p className="text-sm text-muted-foreground">
                Te uniste a <span className="font-medium text-foreground">{workspaceName}</span>. Ya puedes
                colaborar con tu equipo y acceder a los recursos compartidos.
              </p>
            </div>
            <Button className="w-full" onClick={() => router.replace("/chat")}>
              Continuar
            </Button>
            {expireAt && (
              <p className="text-center text-xs text-muted-foreground">{formatExpiry(expireAt)}</p>
            )}
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted">
              <MailWarningIcon className="size-8 text-muted-foreground" />
            </div>
            <p className="text-lg">
              {errorMessage.includes("expired")
                ? "Esta invitación expiró, solicita una nueva."
                : errorMessage.includes("not found")
                  ? "Esta invitación ya fue utilizada o fue cancelada."
                  : "No se pudo procesar la invitación."}
            </p>
            <Button variant="outline" onClick={() => router.push("/login")}>
              Ir a iniciar sesión
            </Button>
          </div>
        )}

        {status === "needsAccount" && (
          <div className="space-y-5">
            <div className="space-y-4 text-center">
              <h1 className="text-xl font-semibold">¡Bienvenido a GOXT CRM!</h1>
              <WorkspaceLogo name={workspaceName} logo={workspaceLogo} size="lg" className="mx-auto rounded-2xl" />
              <div className="space-y-1.5">
                <p className="text-lg font-medium">¡Te están esperando! 👋</p>
                <p className="text-sm text-muted-foreground">
                  Fuiste invitado a unirte al workspace{" "}
                  <span className="font-medium text-foreground">&quot;{workspaceName}&quot;</span>. Ahora podrás
                  colaborar con tu equipo y acceder a todos los recursos compartidos en la plataforma.
                </p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Nombre</Label>
                <Input id="invite-name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Correo</Label>
                <Input id="invite-email" value={email} disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-password">Contraseña</Label>
                <Input id="invite-password" type="password" autoComplete="new-password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-confirm">Confirmar Contraseña</Label>
                <Input id="invite-confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
                {form.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2Icon className="size-4 animate-spin" />}
                Crear cuenta y unirse
              </Button>
            </form>

            {expireAt && (
              <p className="text-center text-xs text-muted-foreground">{formatExpiry(expireAt)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
