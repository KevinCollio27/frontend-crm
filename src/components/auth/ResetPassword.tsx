import Link from "next/link";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

interface ResetPasswordProps {
  token: string;
}

const ResetPassword = ({ token }: ResetPasswordProps) => (
  <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-muted p-4 md:p-6">
    <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-2xl/5 lg:grid-cols-2">
      <div className="flex flex-col gap-5 p-6 md:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Crea tu nueva contraseña</h1>
          <p className="text-balance text-muted-foreground">
            Ingresa tu nueva contraseña
          </p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-center text-sm text-destructive">
            Enlace inválido.{" "}
            <Link className="underline-offset-2 hover:underline" href="/recovery-password">
              Solicitar nuevo código
            </Link>
          </p>
        )}

        <p className="text-center text-sm">
          ¿Recordaste tu contraseña?{" "}
          <Link className="underline-offset-2 hover:underline" href="/login">
            Iniciar sesión
          </Link>
        </p>
      </div>
      <AuthHeroPanel />
    </div>
  </div>
);

export default ResetPassword;
