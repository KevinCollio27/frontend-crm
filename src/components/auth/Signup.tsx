"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { SignUpForm } from "@/components/auth/SignupForm";
import { VerifyOTP } from "@/components/auth/VerifyOTP";
import { Testimonials } from "@/components/auth/Testimonials";
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
              <h1 className="mt-3 text-center font-medium text-2xl">¡Crea tu cuenta!</h1>
              <p className="text-center text-muted-foreground text-sm mt-1">
                Impulsa tus ventas con la plataforma
              </p>
              <div className="mt-2">
                <GoogleButton />
                <div className="my-4 flex items-center justify-center gap-2 overflow-hidden">
                  <Separator />
                  <span className="text-muted-foreground text-sm">O</span>
                  <Separator />
                </div>
                <SignUpForm onSuccess={handleRegistered} />
              </div>
              <p className="mt-6 text-center text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link className="text-blue-600 hover:text-blue-700" href="/login">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}

          {step === 2 && (
            <div className="mt-8">
              <VerifyOTP
                email={email}
                onVerify={handleVerified}
                onResend={handleResend}
                onBack={() => setStep(1)}
                isLoading={isVerifying}
                error={verifyError}
              />
            </div>
          )}
        </div>
      </div>

      <div className="relative flex h-full w-full flex-col overflow-hidden bg-muted/50 dark:bg-muted/30">
        <img
          alt="Sign up"
          className="absolute inset-0 size-full object-cover"
          src="/images/login-hero2.jpg"
        />
        <Testimonials />
      </div>
    </div>
  );
};

export default SignUp;
