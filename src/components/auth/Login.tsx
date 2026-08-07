import Link from "next/link";
import { FieldSeparator } from "@/components/ui/field";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { LoginForm } from "@/components/auth/LoginForm";

const Login = () => (
  <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-muted p-4 md:p-6">
    <div className="grid min-h-160 w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-2xl/5 lg:grid-cols-2">
      <div className="flex flex-col justify-center gap-5 p-6 md:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-balance text-muted-foreground">
            Login to your account to continue
          </p>
        </div>

        <LoginForm />

        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          O continúa con
        </FieldSeparator>

        <GoogleButton />

        <p className="text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link className="underline-offset-2 hover:underline" href="/signup">
            Crear cuenta
          </Link>
        </p>
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

export default Login;
