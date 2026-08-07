"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";
import { notify } from "@/lib/notify";
import { authService } from "@/services/auth.service";
import { PhoneInput } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(2, { message: "Mínimo 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z
    .string()
    .min(1, { message: "El teléfono es requerido" })
    .refine(isValidPhoneNumber, { message: "Número de teléfono inválido" }),
  password: z.string().min(8, { message: "Mínimo 8 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

interface SignUpFormProps {
  onSuccess: (email: string) => void;
}

export const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      await authService.register(values.name, values.email, values.password, values.phone);
      notify.success({ title: "Cuenta creada", description: `Revisa tu correo ${values.email}` });
      onSuccess(values.email);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Error inesperado";
      notify.error({ title: "Error al crear cuenta", description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
      <div className="space-y-2">
        <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>Nombre</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            autoComplete="off"
            placeholder="Tu nombre completo"
            className={`pl-9 ${errors.name ? "border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25" : ""}`}
            {...register("name")}
          />
        </div>
        {errors.name && <p className="text-[0.8rem] text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="off"
            placeholder="Ingresa tu email"
            className={`pl-9 ${errors.email ? "border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25" : ""}`}
            {...register("email")}
          />
        </div>
        {errors.email && <p className="text-[0.8rem] text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className={errors.phone ? "text-destructive" : ""}>Teléfono</Label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <PhoneInput
              id="phone"
              defaultCountry="CL"
              international
              {...({ withCountryCallingCode: true } as any)}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.phone && <p className="text-[0.8rem] text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className={errors.password ? "text-destructive" : ""}>Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Crea una contraseña"
                className={`pl-9 pr-9 ${errors.password ? "border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25" : ""}`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-[0.8rem] text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={errors.confirmPassword ? "text-destructive" : ""}>Confirmar</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                className={`pl-9 pr-9 ${errors.confirmPassword ? "border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25" : ""}`}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-[0.8rem] text-destructive">{errors.confirmPassword.message}</p>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Debe tener al menos 8 caracteres.</p>
      </div>

      <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
        <ArrowRight />
        {isLoading ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
};
