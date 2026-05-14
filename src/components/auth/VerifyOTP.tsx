"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface VerifyOTPProps {
  email: string;
  title?: string;
  description?: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const VerifyOTP = ({
  email,
  title = "Verifica tu correo",
  description,
  onVerify,
  onResend,
  onBack,
  isLoading = false,
  error,
}: VerifyOTPProps) => {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (error) setCode("");
  }, [error]);

  const handleResend = () => {
    onResend();
    setCountdown(60);
    setCanResend(false);
    setCode("");
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="font-medium text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {description ?? (
          <>
            Enviamos un código de 6 dígitos a{" "}
            <span className="font-medium text-foreground">{email}</span>
          </>
        )}
      </p>

      <InputOTP
        containerClassName="mx-auto mt-10"
        maxLength={6}
        value={code}
        onChange={setCode}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={1} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={3} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={4} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}

      <Button
        className="mt-6 w-full"
        size="lg"
        disabled={code.length < 6 || isLoading}
        onClick={() => onVerify(code)}
      >
        <ArrowRight />
        Verificar
      </Button>

      <p className="mt-4 text-sm text-muted-foreground">
        ¿No recibiste el código?{" "}
        {canResend ? (
          <button
            onClick={handleResend}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Reenviar
          </button>
        ) : (
          <span>Reenviar en {countdown}s</span>
        )}
      </p>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Cambiar correo
        </button>
      )}
    </div>
  );
};
