"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
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
import { useSessionStore } from "@/store/session.store"

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
type Phase = "loading" | "error" | "register" | "join" | "already_member" | "done"

interface Props {
  code: string
}

export function InviteLinkView({ code }: Props) {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>("loading")
  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceLogo, setWorkspaceLogo] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [formMode, setFormMode] = useState<"signup" | "login">("signup")
  const [email, setEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", password: "", confirm: "" },
  })

  useEffect(() => {
    authService
      .getInviteLinkInfo(code)
      .then((data) => {
        setWorkspaceName(data.workspace?.name ?? "")
        setWorkspaceLogo(data.workspace?.logo ?? null)

        const user = useSessionStore.getState().user
        const workspaceId = data.workspace?.id
        if (user) {
          const isMember = !!user.user_workspace?.some((uw) => uw.workspace_id === workspaceId)
          setPhase(isMember ? "already_member" : "join")
        } else {
          setPhase("register")
        }
      })
      .catch((err) => {
        setErrorMessage((err as { message?: string })?.message ?? "")
        setPhase("error")
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onRegisterSubmit(values: RegisterValues) {
    setSubmitting(true)
    try {
      await authService.acceptInviteLink(code, values.name, email, values.password)
      setPhase("done")
    } catch (error) {
      const message = (error as { message?: string })?.message ?? ""
      if (message.toLowerCase().includes("ya está registrado") || message.toLowerCase().includes("ya esta registrado")) {
        setFormMode("login")
        notify.info({ title: "Ya tienes una cuenta", description: "Ingresa tu contraseña para unirte." })
      } else {
        notify.error({ title: "No se pudo crear la cuenta", description: message || "Intenta de nuevo." })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!loginPassword) return
    setSubmitting(true)
    try {
      await authService.login(email, loginPassword)
      await authService.joinByInviteLink(code)
      setPhase("done")
    } catch (error) {
      const message = (error as { message?: string })?.message ?? ""
      if (message.includes("Ya perteneces")) {
        setPhase("already_member")
      } else {
        notify.error({ title: "Algo salió mal", description: message || "Verifica tu contraseña." })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleJoin() {
    setSubmitting(true)
    try {
      await authService.joinByInviteLink(code)
      setPhase("done")
    } catch (error) {
      const message = (error as { message?: string })?.message ?? ""
      if (message.includes("Ya perteneces")) {
        setPhase("already_member")
      } else {
        notify.error({ title: "Algo salió mal", description: message || "No se pudo completar la unión." })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card px-8 py-10 shadow-2xl/5">
        {phase === "loading" && (
          <div className="flex justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted">
              <MailWarningIcon className="size-8 text-muted-foreground" />
            </div>
            <p className="text-lg">
              {errorMessage.toLowerCase().includes("desactivado")
                ? "Este enlace de invitación fue desactivado."
                : "Este enlace de invitación no existe."}
            </p>
            <Button variant="outline" onClick={() => router.push("/login")}>
              Ir a iniciar sesión
            </Button>
          </div>
        )}

        {(phase === "join" || phase === "already_member") && (
          <div className="space-y-5 text-center">
            <WorkspaceLogo name={workspaceName} logo={workspaceLogo} size="lg" className="mx-auto rounded-2xl" />
            {phase === "already_member" ? (
              <>
                <div className="space-y-1.5">
                  <p className="text-lg font-medium">Ya estás en el workspace 👋</p>
                  <p className="text-sm text-muted-foreground">
                    Ya eres miembro de <span className="font-medium text-foreground">{workspaceName}</span>, ingresa ahora.
                  </p>
                </div>
                <Button className="w-full" onClick={() => router.replace("/chat")}>
                  Continuar
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <p className="text-lg font-medium">¡Te están esperando! 👋</p>
                  <p className="text-sm text-muted-foreground">
                    Fuiste invitado a unirte a <span className="font-medium text-foreground">{workspaceName}</span>.
                  </p>
                </div>
                <Button className="w-full" onClick={handleJoin} disabled={submitting}>
                  {submitting && <Loader2Icon className="size-4 animate-spin" />}
                  Unirme a {workspaceName}
                </Button>
              </>
            )}
          </div>
        )}

        {phase === "done" && (
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
          </div>
        )}

        {phase === "register" && formMode === "signup" && (
          <div className="space-y-5">
            <div className="space-y-4 text-center">
              <h1 className="text-xl font-semibold">¡Bienvenido a GOXT CRM!</h1>
              <WorkspaceLogo name={workspaceName} logo={workspaceLogo} size="lg" className="mx-auto rounded-2xl" />
              <div className="space-y-1.5">
                <p className="text-lg font-medium">¡Te están esperando! 👋</p>
                <p className="text-sm text-muted-foreground">
                  Crea tu cuenta para unirte a{" "}
                  <span className="font-medium text-foreground">&quot;{workspaceName}&quot;</span> y colaborar con
                  tu equipo.
                </p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="link-name">Nombre</Label>
                <Input id="link-name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="link-email">Correo</Label>
                <Input
                  id="link-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="link-password">Contraseña</Label>
                <Input id="link-password" type="password" autoComplete="new-password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="link-confirm">Confirmar Contraseña</Label>
                <Input id="link-confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
                {form.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2Icon className="size-4 animate-spin" />}
                Crear cuenta y unirse
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <button type="button" className="underline hover:text-foreground" onClick={() => setFormMode("login")}>
                Inicia sesión
              </button>
            </p>
          </div>
        )}

        {phase === "register" && formMode === "login" && (
          <div className="space-y-5">
            <div className="space-y-4 text-center">
              <WorkspaceLogo name={workspaceName} logo={workspaceLogo} size="lg" className="mx-auto rounded-2xl" />
              <div className="space-y-1.5">
                <p className="text-lg font-medium">Ese correo ya tiene cuenta</p>
                <p className="text-sm text-muted-foreground">
                  Ingresa tu contraseña para unirte a{" "}
                  <span className="font-medium text-foreground">{workspaceName}</span>.
                </p>
              </div>
            </div>

            <form onSubmit={onLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="link-login-email">Correo</Label>
                <Input id="link-login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="link-login-password">Contraseña</Label>
                <Input
                  id="link-login-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2Icon className="size-4 animate-spin" />}
                Iniciar sesión y unirme
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              <button type="button" className="underline hover:text-foreground" onClick={() => setFormMode("signup")}>
                Volver a crear cuenta
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
