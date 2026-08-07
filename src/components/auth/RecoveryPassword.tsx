"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { RecoveryPasswordForm } from "@/components/auth/RecoveryPasswordForm";
import { VerifyOTP } from "@/components/auth/VerifyOTP";
import { notify } from "@/lib/notify";
import { authService } from "@/services/auth.service";

const RecoveryPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  const handleEmailSent = (userEmail: string) => {
    setEmail(userEmail);
    setStep(2);
  };

  const handleVerify = async (code: string) => {
    setIsVerifying(true);
    try {
      const data = await authService.verifyRecoveryPassword(email, code);
      if (data.resetToken) {
        router.push(`/reset-password?token=${data.resetToken}`);
      }
    } catch (err: unknown) {
      const e = err as { extraMessage?: string; message?: string };
      const msg = e.extraMessage || e.message || "Código inválido";
      notify.error({ title: "Código inválido o expirado", description: `${msg}. Intenta nuevamente.` });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.recoveryPassword(email);
      notify.success({ title: "Código reenviado", description: `Revisa tu correo ${email}` });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Error inesperado";
      notify.error({ title: "Error inesperado", description: msg });
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-muted p-4 md:p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-2xl/5 lg:grid-cols-2">
        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
                <p className="text-balance text-muted-foreground">
                  Te enviaremos un código de 6 dígitos a tu correo.
                </p>
              </div>

              <RecoveryPasswordForm onSuccess={handleEmailSent} />

              <p className="text-center text-sm">
                ¿Recordaste tu contraseña?{" "}
                <Link className="underline-offset-2 hover:underline" href="/login">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <VerifyOTP
                email={email}
                onVerify={handleVerify}
                onResend={handleResend}
                isLoading={isVerifying}
              />

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Cambiar correo
                </button>
                <p className="text-center text-sm">
                  ¿Recordaste tu contraseña?{" "}
                  <Link className="underline-offset-2 hover:underline" href="/login">
                    Iniciar sesión
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
        <AuthHeroPanel />
      </div>
    </div>
  );
};

export default RecoveryPassword;
