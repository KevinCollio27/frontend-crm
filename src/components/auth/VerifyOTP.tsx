"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface VerifyOTPProps {
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
}

export const VerifyOTP = ({ email, onVerify, onResend }: VerifyOTPProps) => {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = () => {
    onResend();
    setCountdown(60);
    setCanResend(false);
    setCode("");
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="font-medium text-2xl">Verifica tu correo</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enviamos un código de 6 dígitos a{" "}
        <span className="font-medium text-foreground">{email}</span>
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

      <Button
        className="mt-10 w-full"
        size="lg"
        disabled={code.length < 6}
        onClick={() => onVerify(code)}
      >
        <ArrowRight />
        Verificar
      </Button>

      <p className="mt-6 text-sm text-muted-foreground">
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
    </div>
  );
};
