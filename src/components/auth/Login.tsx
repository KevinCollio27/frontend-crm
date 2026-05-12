import { Aperture, KeySquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GoogleLogo } from "@/components/auth/Icons";
import { LoginForm } from "@/components/auth/LoginForm";
import { Testimonials } from "./Testimonials";

const Login = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x">
    <div className="flex h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md px-10 py-14 sm:rounded-2xl sm:border sm:bg-card sm:shadow-2xl/5">
        <img src="/images/goxt-negro.png" alt="GOXT CRM" className="mx-auto h-10 w-auto" />
        <h1 className="mt-3 text-center font-medium text-2xl">
          ¡Bienvenido de nuevo!
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Gestiona tu pipeline de ventas en un solo lugar.
        </p>

        <div className="mt-2">
          <Button className="w-full" size="lg" type="button">
            <GoogleLogo className="mr-2 size-4" />
            Continuar con Google
          </Button>

          <div className="my-4 flex items-center justify-center gap-2 overflow-hidden">
            <Separator />
            <span className="text-muted-foreground text-sm">O</span>
            <Separator />
          </div>

          <LoginForm />
        </div>

        <Link
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
          href="/recovery-password"
        >
          <KeySquare className="size-4" />
          ¿Olvidaste tu contraseña?
        </Link>

        <p className="mt-6 text-center text-sm">
          ¿Nuevo en GOXT CRM?{" "}
          <Link className="text-blue-600 hover:text-blue-700" href="/signup">
            Crear una cuenta
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

      {/* <div
        className="absolute inset-0 -top-px -left-px -z-1 dark:opacity-70"
        style={{
          backgroundImage: `
        linear-gradient(to right, color-mix(in srgb,var(--foreground) 20%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb,var(--foreground) 20%, transparent) 1px, transparent 1px)
      `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        )
      `,
          WebkitMaskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        )
      `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      /> */}
    </div>
  </div>
);

export default Login;
