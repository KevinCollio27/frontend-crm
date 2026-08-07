"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FieldSeparator } from "@/components/ui/field";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { SignUpForm } from "@/components/auth/SignupForm";
import { VerifyOTP } from "@/components/auth/VerifyOTP";
import { notify } from "@/lib/notify";
import { authService } from "@/services/auth.service";

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const router = useRouter();

  const handleRegistered = (userEmail: string) => {
    setEmail(userEmail);
    setVerifyError("");
    setStep(2);
  };

  const handleVerified = async (code: string) => {
    setIsVerifying(true);
    setVerifyError("");
    try {
      await authService.verifyEmail(email, code);
      router.push("/create-workspace");
    } catch (err: unknown) {
      const e = err as { extraMessage?: string; message?: string };
      const msg = e.extraMessage || e.message || "Código inválido";
      setVerifyError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendVerificationEmail(email);
      notify.success({ title: "Código reenviado", description: `Revisa tu correo ${email}` });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Error inesperado";
      notify.error({ title: "Error inesperado", description: msg });
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-muted p-4 md:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-2xl/5 lg:grid-cols-2">
        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
                <p className="text-balance text-muted-foreground">
                  Completa el formulario para crear tu cuenta
                </p>
              </div>

              <SignUpForm onSuccess={handleRegistered} />

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                O continúa con
              </FieldSeparator>

              <GoogleButton />

              <p className="text-center text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link className="underline-offset-2 hover:underline" href="/login">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <VerifyOTP
              email={email}
              onVerify={handleVerified}
              onResend={handleResend}
              onBack={() => setStep(1)}
              isLoading={isVerifying}
              error={verifyError}
            />
          )}
        </div>
        <AuthHeroPanel />
      </div>

      <p className="max-w-5xl text-center text-sm text-muted-foreground">
        Al continuar, aceptas los{" "}
        <Link
          href="https://goxt.io/terminos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline-offset-2 hover:underline"
        >
          Términos de Servicio
        </Link>{" "}
        y la{" "}
        <Link
          href="https://goxt.io/privacidad"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline-offset-2 hover:underline"
        >
          Política de Privacidad
        </Link>
        .
      </p>
    </div>
  );
};

export default SignUp;
