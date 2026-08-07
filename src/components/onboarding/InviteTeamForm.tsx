"use client";

import { useState } from "react";
import { Loader2Icon, Plus, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import { teamService } from "@/services/team.service";

interface Props {
  onSuccess: () => void;
  onSkip: () => void;
}

export const InviteTeamForm = ({ onSuccess, onSkip }: Props) => {
  const [emails, setEmails] = useState<string[]>([""]);
  const [errors, setErrors] = useState<string[]>([""]);
  const [isSending, setIsSending] = useState(false);

  const updateEmail = (index: number, value: string) => {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
    setErrors((prev) => prev.map((e, i) => (i === index ? "" : e)));
  };

  const addEmail = () => {
    setEmails((prev) => [...prev, ""]);
    setErrors((prev) => [...prev, ""]);
  };

  const removeEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors = emails.map((e) => {
      if (!e) return "";
      return emailRegex.test(e) ? "" : "Email inválido";
    });
    setErrors(newErrors);
    return newErrors.every((e) => e === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const validEmails = emails.filter(Boolean);
    if (validEmails.length === 0) { onSuccess(); return; }

    setIsSending(true);
    const t0 = performance.now();
    try {
      await teamService.inviteUsers(validEmails);
      console.log(`⏱️ [InviteTeam] inviteUsers: ${Math.round(performance.now() - t0)}ms`);
      notify.success({
        title: "Invitaciones enviadas",
        description: "Se enviaron correctamente a los correos indicados.",
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Intenta de nuevo.";
      notify.error({ title: "No se pudieron enviar las invitaciones", description: msg });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Invita a tu Equipo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega colaboradores para trabajar juntos desde el inicio
        </p>
      </div>

      <div className="space-y-3">
        <Label>Correos electrónicos</Label>
        {emails.map((email, index) => (
          <div key={index} className="space-y-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  className={`pl-9 ${errors[index] ? "border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25" : ""}`}
                />
              </div>
              {emails.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmail(index)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            {errors[index] && (
              <p className="text-[0.8rem] text-destructive">{errors[index]}</p>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addEmail}
          className="text-muted-foreground"
        >
          <Plus className="size-4 mr-1" />
          Agregar otro
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full" size="lg" disabled={isSending}>
          {isSending && <Loader2Icon className="size-4 animate-spin" />}
          {isSending ? "Enviando..." : "Enviar invitaciones"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" size="lg" onClick={onSkip} disabled={isSending}>
          Omitir por ahora
        </Button>
      </div>
    </form>
  );
};
