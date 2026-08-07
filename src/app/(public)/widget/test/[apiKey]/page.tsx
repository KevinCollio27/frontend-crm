import type { Metadata } from "next"
import { WidgetTestView } from "./_components/WidgetTestView"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WidgetPublicConfig {
  name: string
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchWidgetConfig(apiKey: string): Promise<WidgetPublicConfig | null> {
  const api = process.env.API_URL
  if (!api) throw new Error("API_URL not configured")
  try {
    const res = await fetch(`${api}/api/widget/${apiKey}/config`, { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    return (data.data ?? null) as WidgetPublicConfig | null
  } catch {
    return null
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ apiKey: string }>
}): Promise<Metadata> {
  const { apiKey } = await params
  const widget = await fetchWidgetConfig(apiKey)
  return {
    title: widget ? `Vista previa — ${widget.name}` : "Widget no encontrado",
    robots: { index: false },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function WidgetTestPage({
  params,
}: {
  params: Promise<{ apiKey: string }>
}) {
  const { apiKey } = await params
  const widget = await fetchWidgetConfig(apiKey)

  if (!widget) return <WidgetNotFound />

  return <WidgetTestView apiKey={apiKey} />
}

// ─── Error state ──────────────────────────────────────────────────────────────

function WidgetNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-semibold">Widget no encontrado</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          El enlace no coincide con ningún widget activo de GOxT.
        </p>
      </div>
    </div>
  )
}
