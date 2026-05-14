"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
});

type FormValues = z.infer<typeof formSchema>;

interface RecoveryPasswordFormProps {
  onSuccess: (email: string) => void;
}

export const RecoveryPasswordForm = ({ onSuccess }: RecoveryPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      await authService.recoveryPassword(values.email);
      toast.success("Código enviado", { description: `Revisa tu correo ${values.email}` });
      onSuccess(values.email);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Error inesperado";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Ingresa tu email"
            className={`pl-9 ${errors.email ? "border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25" : ""}`}
            {...register("email")}
          />
        </div>
        {errors.email && <p className="text-[0.8rem] text-destructive">{errors.email.message}</p>}
      </div>

      <Button className="mt-2 w-full" size="lg" type="submit" disabled={isLoading}>
        <ArrowRight />
        {isLoading ? "Enviando..." : "Enviar código"}
      </Button>
    </form>
  );
};
