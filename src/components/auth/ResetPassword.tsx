import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Testimonials } from "@/components/auth/Testimonials";

interface ResetPasswordProps {
  token: string;
}

const ResetPassword = ({ token }: ResetPasswordProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x">
    <div className="flex h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md px-10 py-14 sm:rounded-2xl sm:border sm:bg-card sm:shadow-2xl/5">
        <img src="/images/goxt-negro.png" alt="GOXT CRM" className="mx-auto h-10 w-auto" />
        <h1 className="mt-3 text-center font-medium text-2xl">
          Crea tu Nueva Contraseña
        </h1>
        <p className="text-center text-muted-foreground text-sm mt-1">
          Ingresa tu nueva contraseña
        </p>

        {token ? (
          <div className="mt-2">
            <ResetPasswordForm token={token} />
          </div>
        ) : (
          <p className="mt-6 text-center text-sm text-destructive">
            Enlace inválido.{" "}
            <Link className="text-blue-600 hover:text-blue-700" href="/recovery-password">
              Solicitar nuevo código
            </Link>
          </p>
        )}

        <p className="mt-6 text-center text-sm">
          ¿Recordaste tu contraseña?{" "}
          <Link className="text-blue-600 hover:text-blue-700" href="/login">
            Iniciar sesión
          </Link>
        </p>
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

export default ResetPassword;
