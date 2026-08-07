"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { notify } from "@/lib/notify";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(8, { message: "Mínimo 8 caracteres" }),
});

type FormValues = z.infer<typeof formSchema>;

export const LoginForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const data = await authService.login(values.email, values.password, rememberMe);
      const firstName = data.user?.name?.split(" ")[0] ?? "";
      notify.success({ title: `¡Bienvenido, ${firstName}!`, description: "Comienza a gestionar tus ventas." });
      const hasWorkspace = !!data.user?.user_workspace?.[0]?.workspace_id;
      router.replace(hasWorkspace ? "/chat" : "/create-workspace");
    } catch (err: unknown) {
      const e = err as { extraMessage?: string; message?: string };
      const msg = e.extraMessage || e.message || "Verifica tu email y contraseña.";
      notify.error({ title: "Credenciales incorrectas", description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className={errors.password ? "text-destructive" : ""}>Contraseña</Label>
          <Link href="/recovery-password" className="text-sm underline-offset-2 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Ingresa tu contraseña"
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

      <div className="flex items-center gap-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(v) => setRememberMe(!!v)}
        />
        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Recuérdame</Label>
      </div>

      <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
        <ArrowRight />
        {isLoading ? "Iniciando sesión..." : "Continuar con Email"}
      </Button>
    </form>
  );
};
