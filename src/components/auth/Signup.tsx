"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GoogleLogo } from "@/components/auth/Icons";
import { SignUpForm } from "@/components/auth/SignupForm";
import { VerifyOTP } from "@/components/auth/VerifyOTP";
import { Testimonials } from "@/components/auth/Testimonials";
import { useRouter } from "next/navigation";



const SignUp = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleRegistered = (userEmail: string) => {
    setEmail(userEmail);
    setStep(2);
  };

  const handleVerified = (code: string) => {
    console.log("Código verificado:", code);
    router.push("/create-workspace");
  };

  const handleResend = () => {
    console.log("Reenviar OTP a:", email);
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
              <div className="mt-10">
                <Button className="w-full" size="lg" type="button">
                  <GoogleLogo className="mr-2 size-4" />
                  Continuar con Google
                </Button>
                <div className="my-6 flex items-center justify-center gap-2 overflow-hidden">
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
