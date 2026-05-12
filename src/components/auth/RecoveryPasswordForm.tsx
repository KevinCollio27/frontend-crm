"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
});

type FormValues = z.infer<typeof formSchema>;

export const RecoveryPasswordForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: FormValues) {
    console.log(values);
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

      <Button className="mt-2 w-full" size="lg" type="submit">
        <ArrowRight />
        Enviar enlace
      </Button>
    </form>
  );
};
