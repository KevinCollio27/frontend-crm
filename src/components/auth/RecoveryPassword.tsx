"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RecoveryPasswordForm } from "@/components/auth/RecoveryPasswordForm";
import { VerifyOTP } from "@/components/auth/VerifyOTP";
import { Testimonials } from "@/components/auth/Testimonials";
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
      toast.error("Código inválido o expirado", { description: `${msg}. Intenta nuevamente.` });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.recoveryPassword(email);
      toast.success("Código reenviado", { description: `Revisa tu correo ${email}` });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Error inesperado";
      toast.error(msg);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x">
      <div className="flex h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-md px-10 py-14 sm:rounded-2xl sm:border sm:bg-card sm:shadow-2xl/5">
          <img src="/images/goxt-negro.png" alt="GOXT CRM" className="mx-auto h-10 w-auto" />

          {step === 1 && (
            <>
              <h1 className="mt-3 text-center font-medium text-2xl">Recuperar contraseña</h1>
              <p className="text-center text-muted-foreground text-sm mt-1">
                Te enviaremos un código de 6 dígitos a tu correo.
              </p>
              <div className="mt-2">
                <RecoveryPasswordForm onSuccess={handleEmailSent} />
              </div>
              <p className="mt-6 text-center text-sm">
                ¿Recordaste tu contraseña?{" "}
                <Link className="text-blue-600 hover:text-blue-700" href="/login">
                  Iniciar sesión
                </Link>
              </p>
            </>
          )}

          {step === 2 && (
            <div className="mt-8">
              <VerifyOTP
                email={email}
                onVerify={handleVerify}
                onResend={handleResend}
                isLoading={isVerifying}
              />
              <p className="mt-6 text-center text-sm">
                <button
                  onClick={() => setStep(1)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Cambiar correo
                </button>
              </p>
              <p className="mt-2 text-center text-sm">
                ¿Recordaste tu contraseña?{" "}
                <Link className="text-blue-600 hover:text-blue-700" href="/login">
                  Inicia sesión
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex h-full w-full flex-col overflow-hidden bg-muted/50 dark:bg-muted/30">
        <img
          alt="Login"
          className="absolute inset-0 size-full object-cover"
          src="/images/login-hero2.jpg"
        />
        <Testimonials />
      </div>
    </div>
  );
};

export default RecoveryPassword;
