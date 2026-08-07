"use client"

import * as React from "react"
import { CheckCircle2Icon, Loader2Icon, LockIcon, MoonIcon, ShieldCheckIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import type { FormDesignState } from "@/components/dashboard/forms/shared/form-state"
import { FONT_FAMILY } from "@/components/dashboard/forms/shared/form-state"

export const FALLBACK_COVER_IMAGE = "/images/login-hero2.jpg"

const AVATARS = [
  "https://github.com/shadcn.png",
  "https://github.com/leerob.png",
  "https://github.com/rauchg.png",
  "https://github.com/shuding.png",
]

const DENSITY_PADDING: Record<string, string> = {
  compact: "1rem",
  comfortable: "1.5rem",
  spacious: "2.25rem",
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="size-8" />

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Cambiar tema"
    >
      {resolvedTheme === "dark" ? <SunIcon className="size-3.5" /> : <MoonIcon className="size-3.5" />}
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface PublicFormShellProps {
  design: FormDesignState
  title: string
  subtitle?: string
  status: "idle" | "loading" | "success" | "error"
  countdown: number
  errorMessage?: string
  onReset: () => void
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
  /** Renderizado dentro de un contenedor (ej. vista previa del builder) — sin
   * elementos "fixed"/de página completa (toggle de tema, logo, panel de imagen). */
  embedded?: boolean
}

export function PublicFormShell({
  design: d,
  title,
  subtitle,
  status,
  countdown,
  errorMessage,
  onReset,
  onSubmit,
  children,
  embedded = false,
}: PublicFormShellProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === "dark"

  const padding = DENSITY_PADDING[d.density] ?? DENSITY_PADDING.comfortable
  const buttonStyle: React.CSSProperties = isDark
    ? { backgroundColor: "#ffffff", color: "#111827", borderRadius: d.radius }
    : { backgroundColor: d.primary, color: "#ffffff", borderRadius: d.radius }

  const successCard = (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-background p-6 shadow-sm md:p-8 dark:bg-muted/50">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2Icon className="size-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">¡Formulario Completado!</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Gracias por completar el formulario. Pronto nos pondremos en contacto contigo. ¡Te deseamos éxito!
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Estado de sincronización:</span>
          <span className="flex items-center gap-1.5 font-semibold text-green-600 dark:text-green-400">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-green-500" />
            </span>
            En línea (SSL)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-1000 ease-linear"
            style={{ width: `${((10 - countdown) / 10) * 100}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          El formulario se reiniciará en <span className="font-semibold text-foreground">{countdown}s</span>
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Volver a empezar manualmente
      </button>
    </div>
  )

  const formCard = (
    <div
      className="flex flex-col gap-5 rounded-xl border border-border bg-background shadow-sm dark:bg-muted/50"
      style={{ padding, fontFamily: FONT_FAMILY[d.font] }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <hr className="border-border" />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {children}

        {status === "error" && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage || "Ocurrió un error al enviar. Por favor intenta de nuevo."}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2"
            disabled={status === "loading"}
            style={buttonStyle}
          >
            {status === "loading" && <Loader2Icon className="size-4 animate-spin" />}
            {status === "loading" ? "Enviando..." : (d.buttonLabel || "Enviar")}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheckIcon className="size-3.5 shrink-0 text-green-600" />
            <span>Tus datos están protegidos. No compartimos tu información.</span>
          </div>
        </div>
      </form>
    </div>
  )

  const footer = (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <a
        href="https://goxt.io"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 opacity-50 transition-opacity hover:opacity-90"
      >
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Powered by
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/goxt-negro.png" alt="GOxT" className="h-3.5 w-auto dark:invert" />
      </a>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <LockIcon className="size-2.5" /> SSL
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <ShieldCheckIcon className="size-2.5" /> Secure
        </span>
      </div>
    </div>
  )

  const imagePanel = (
    <div className="relative hidden shrink-0 lg:block lg:w-[44%]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={d.coverImage || FALLBACK_COVER_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = FALLBACK_COVER_IMAGE
        }}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 flex h-full flex-col justify-center p-10">
        <a
          href="https://goxt.io"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-6 left-8 opacity-90 transition-opacity hover:opacity-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/goxt-negro.png" alt="GOxT" className="h-8 w-auto invert" />
        </a>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-400" />
            </span>
            <span className="text-xs font-medium tracking-wide text-white/90">
              Formulario abierto · responde en 24h
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl leading-tight font-bold text-white">
              Convierte cada visita<br />en una conversación.
            </h2>
            <p className="text-sm leading-relaxed text-white/80">
              Un solo formulario para inscripciones, cotizaciones o levantamiento de leads — conectado a tu CRM en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {AVATARS.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="size-8 rounded-full border-2 border-white/25 object-cover" />
              ))}
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-white">+2.400 respuestas este año</p>
              <p className="text-xs text-white/70">Empresas que confían en GOxT CRM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const cardContent = status === "success" ? successCard : formCard

  if (embedded) {
    return (
      <div className="bg-muted p-6 dark:bg-background" style={{ fontFamily: FONT_FAMILY[d.font] }}>
        {cardContent}
      </div>
    )
  }

  if (d.layout === "2col") {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div
          className="flex h-screen overflow-hidden"
          style={{ flexDirection: d.imageSide === "right" ? "row-reverse" : "row" }}
        >
          {imagePanel}
          <div className="flex flex-1 flex-col overflow-y-auto bg-muted dark:bg-background">
            <div className="w-full px-8 pt-16 pb-12 lg:px-14 xl:px-20">
              <div className="flex flex-col gap-6">
                {cardContent}
                {footer}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="relative min-h-screen bg-muted dark:bg-background">
        <div className="absolute top-6 left-8">
          <a
            href="https://goxt.io"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-80 transition-opacity hover:opacity-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/goxt-negro.png" alt="GOxT" className="h-8 w-auto dark:invert" />
          </a>
        </div>
        <div className="mx-auto w-full max-w-xl px-4 pt-20 pb-12">
          <div className="flex flex-col gap-6">
            {cardContent}
            {footer}
          </div>
        </div>
      </div>
    </>
  )
}
