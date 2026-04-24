"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, UploadIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
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

const profileSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Correo inválido"),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Campo requerido"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Campo requerido"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

const currentUser = {
  name: "Kevin Collio",
  email: "kevin.collio@goxt.io",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function ProfileForm() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser.name,
      email: currentUser.email,
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

  function onProfileSubmit(values: ProfileValues) {
    console.log("profile:", values)
  }

  function onPasswordSubmit(values: PasswordValues) {
    console.log("password:", values)
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
                <AvatarImage src="https://github.com/shadcn.png" alt={currentUser.name} />
                <AvatarFallback className="text-base">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1.5">
                <Button type="button" variant="outline" size="sm" className="w-fit gap-2">
                  <UploadIcon className="size-3.5" />
                  Subir imagen
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG o GIF. Máx. 2MB</p>
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
                  {...profileForm.register("email")}
                  className={profileForm.formState.errors.email ? "border-destructive" : ""}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-[0.8rem] text-destructive">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => profileForm.reset()}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
          </CardFooter>
        </Card>
      </form>

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
            <Button type="button" variant="outline" onClick={() => passwordForm.reset()}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
