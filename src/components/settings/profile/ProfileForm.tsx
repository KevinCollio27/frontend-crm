"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2Icon, PencilIcon, ShieldCheckIcon, UploadIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import type { Value as PhoneValue } from "react-phone-number-input"
import { z } from "zod"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/phone-input"
import { getInitials } from "@/lib/table-utils"
import { notify } from "@/lib/notify"
import { userService } from "@/services/user.service"
import { whatsappService } from "@/services/whatsapp.service"
import { useSessionStore } from "@/store/session.store"
import { passwordFieldSchema } from "@/lib/password-rules"
import type { MyWhatsAppNumberRaw } from "@/types/whatsapp"

const profileSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Correo inválido"),
  phone: z.string().optional(),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Campo requerido"),
    newPassword: passwordFieldSchema,
    confirmPassword: z.string().min(1, "Campo requerido"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export function ProfileForm() {
  const user = useSessionStore((s) => s.user)
  const workspaceId = useSessionStore((s) => s.workspaceId)
  const setSession = useSessionStore((s) => s.setSession)

  const [editingProfile, setEditingProfile] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [waConfig, setWaConfig] = useState<MyWhatsAppNumberRaw | null>(null)
  const [loadingWa, setLoadingWa] = useState(true)
  const [editingWa, setEditingWa] = useState(false)
  const [waNumber, setWaNumber] = useState("")
  const [savingWa, setSavingWa] = useState(false)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (user) profileForm.reset({ name: user.name, email: user.email, phone: user.phone ?? "" })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    whatsappService.getMyNumber()
      .then((result) => {
        setWaConfig(result)
        setWaNumber(result?.whatsapp_number ?? user?.phone ?? "")
      })
      .finally(() => setLoadingWa(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveWaNumber() {
    setSavingWa(true)
    try {
      const result = await whatsappService.setMyNumber(waNumber || null)
      setWaConfig(result)
      setEditingWa(false)
      notify.success({ title: "Número guardado", description: "Tu número de WhatsApp quedó vinculado." })
    } catch (error) {
      notify.error({ title: "Algo salió mal", description: (error as { message?: string })?.message ?? "No se pudo guardar el número." })
    } finally {
      setSavingWa(false)
    }
  }

  async function onProfileSubmit(values: ProfileValues) {
    if (!user) return
    setSavingProfile(true)
    try {
      const updatedUser = await userService.updateProfile({
        userId: user.id,
        name: values.name,
        email: values.email,
        phone: values.phone || null,
      })
      setSession({ ...user, ...updatedUser }, workspaceId)
      setEditingProfile(false)
      notify.success({ title: "Perfil actualizado", description: "Tus datos se guardaron correctamente." })
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo actualizar el perfil." })
    } finally {
      setSavingProfile(false)
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    if (!user) return
    setSavingPassword(true)
    try {
      await userService.updatePassword({
        userId: user.id,
        password_actual: values.currentPassword,
        password: values.newPassword,
        confirm: values.confirmPassword,
      })
      notify.success({ title: "Contraseña actualizada", description: "Tu contraseña se cambió correctamente." })
      passwordForm.reset()
    } catch {
      notify.error({ title: "No se pudo cambiar la contraseña", description: "Revisa que la contraseña actual sea correcta." })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tu nombre y correo electrónico</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src="https://github.com/shadcn.png" alt={user?.name ?? ""} />
                <AvatarFallback className="text-base">
                  {getInitials(user?.name ?? "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1.5">
                <Button type="button" variant="outline" size="sm" className="w-fit gap-2" disabled>
                  <UploadIcon className="size-3.5" />
                  Subir imagen
                </Button>
                <p className="text-xs text-muted-foreground">Próximamente</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className={profileForm.formState.errors.name ? "text-destructive" : ""}
                >
                  Nombre
                </Label>
                <Input
                  id="name"
                  disabled={!editingProfile}
                  {...profileForm.register("name")}
                  className={profileForm.formState.errors.name ? "border-destructive" : ""}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-[0.8rem] text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className={profileForm.formState.errors.email ? "text-destructive" : ""}
                >
                  Correo
                </Label>
                <Input
                  id="email"
                  type="email"
                  disabled={!editingProfile}
                  {...profileForm.register("email")}
                  className={profileForm.formState.errors.email ? "border-destructive" : ""}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-[0.8rem] text-destructive">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Controller
                  name="phone"
                  control={profileForm.control}
                  render={({ field }) => (
                    <PhoneInput
                      id="phone"
                      defaultCountry="CL"
                      international
                      disabled={!editingProfile}
                      value={field.value as PhoneValue}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {editingProfile ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingProfile}
                  onClick={() => { profileForm.reset(); setEditingProfile(false) }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile && <Loader2Icon className="size-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" className="gap-1.5" onClick={() => setEditingProfile(true)}>
                <PencilIcon className="size-3.5" /> Editar
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Acceso administrativo por WhatsApp</CardTitle>
          <CardDescription>
            Vincula el número desde el que le escribes al WhatsApp del negocio para que un admin o propietario te dé acceso a gestionar el CRM por chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {loadingWa ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5 max-w-xs">
                <Label htmlFor="wa-number">Mi número de WhatsApp</Label>
                <PhoneInput
                  id="wa-number"
                  defaultCountry="CL"
                  international
                  disabled={!editingWa}
                  value={waNumber as PhoneValue}
                  onChange={(v) => setWaNumber(v ?? "")}
                />
              </div>

              {waConfig?.whatsapp_number && (
                <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                  waConfig.whatsapp_enabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
                }`}>
                  <ShieldCheckIcon className="size-3.5 shrink-0" />
                  {waConfig.whatsapp_enabled
                    ? "Acceso administrativo activo — puedes gestionar el CRM escribiendo por WhatsApp."
                    : "Número vinculado, pendiente de que un admin o propietario active el acceso."}
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {editingWa ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={savingWa}
                onClick={() => { setWaNumber(waConfig?.whatsapp_number ?? user?.phone ?? ""); setEditingWa(false) }}
              >
                Cancelar
              </Button>
              <Button type="button" disabled={savingWa} onClick={handleSaveWaNumber}>
                {savingWa && <Loader2Icon className="size-4 animate-spin" />}
                Guardar número
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" className="gap-1.5" onClick={() => setEditingWa(true)}>
              <PencilIcon className="size-3.5" /> Editar
            </Button>
          )}
        </CardFooter>
      </Card>

      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="off"
                  className={`pr-9 ${passwordForm.formState.errors.currentPassword ? "border-destructive" : ""}`}
                  {...passwordForm.register("currentPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-[0.8rem] text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    className={`pr-9 ${passwordForm.formState.errors.newPassword ? "border-destructive" : ""}`}
                    {...passwordForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-[0.8rem] text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    className={`pr-9 ${passwordForm.formState.errors.confirmPassword ? "border-destructive" : ""}`}
                    {...passwordForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-[0.8rem] text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => passwordForm.reset()} disabled={savingPassword}>
              Cancelar
            </Button>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2Icon className="size-4 animate-spin" />}
              Guardar cambios
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
