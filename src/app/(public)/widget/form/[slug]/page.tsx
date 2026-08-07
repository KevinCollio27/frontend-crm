import { CircleHelpIcon, LockIcon } from "lucide-react"
import type { Metadata } from "next"
import type { BlocksBaseConfig, ClassicBaseConfig, PublicFormConfig } from "@/types/public-form"
import { isBlocksFormat } from "@/types/public-form"
import { ClassicRenderer } from "./_components/ClassicRenderer"
import { BlocksRenderer } from "./_components/BlocksRenderer"

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchForm(slug: string): Promise<PublicFormConfig | null> {
  const api = process.env.API_URL
  if (!api) throw new Error("API_URL not configured")
  try {
    const res = await fetch(`${api}/api/widget/form/${slug}`, { cache: "no-store" })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return (data.form ?? data.result?.form ?? null) as PublicFormConfig | null
  } catch {
    return null
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const form = await fetchForm(slug)
  return {
    title: form?.name ?? "Formulario",
    robots: { index: false },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const form = await fetchForm(slug)

  if (!form) return <FormNotFound />

  if (!form.is_active) return <FormInactive />

  // ── Blocks format ──
  if (isBlocksFormat(form.base_config)) {
    return (
      <BlocksRenderer
        slug={form.slug}
        name={form.name}
        config={form.base_config as BlocksBaseConfig}
      />
    )
  }

  // ── Classic format ──
  const config = form.base_config as ClassicBaseConfig

  return (
    <ClassicRenderer
      slug={form.slug}
      name={form.name}
      config={config}
      customFields={form.custom_fields}
    />
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Powered by</span>
          <span className="text-xs font-bold tracking-tight text-foreground">GOxT</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Error states ─────────────────────────────────────────────────────────────

function FormNotFound() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-5 px-8 py-14 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <CircleHelpIcon className="size-8 text-red-500 dark:text-red-400" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold">Formulario No Encontrado (404)</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            El enlace que has introducido no coincide con ningún formulario activo de la plataforma GOxT.
          </p>
        </div>
        <code className="rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
          ERR_FORM_NOT_FOUND
        </code>
      </div>
    </PageShell>
  )
}

function FormInactive() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-5 px-8 py-14 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <LockIcon className="size-8 text-amber-500 dark:text-amber-400" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold">Formulario Inactivo</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            ¡Lo lamentamos! Este formulario no está recibiendo respuestas por el momento, ya que el administrador lo desactivó temporalmente.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Ponte en contacto con el{" "}
          <span className="font-semibold text-foreground">Administrador del sistema</span>{" "}
          para notificarle.
        </p>
      </div>
    </PageShell>
  )
}
