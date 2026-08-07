"use client"

import * as React from "react"

function WidgetEmbedScript({ apiKey }: { apiKey: string }) {
  React.useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) return
    if (document.querySelector(`script[data-api-key="${apiKey}"]`)) return

    const script = document.createElement("script")
    script.src = `${apiUrl}/api/widget/embed.js`
    script.setAttribute("data-api-key", apiKey)
    // Los scripts creados con createElement son async por defecto, lo que
    // rompe document.currentScript (el embed lo usa para leer el api-key).
    script.async = false
    document.body.appendChild(script)

    return () => {
      script.remove()
      document.querySelectorAll(".goxt-widget-launcher, .goxt-widget-container").forEach((el) => el.remove())
    }
  }, [apiKey])

  return null
}

export function WidgetTestView({ apiKey }: { apiKey: string }) {
  return (
    <div
      className="min-h-screen w-full bg-black bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: "url(/images/header2.png)" }}
    >
      <div className="pointer-events-none fixed top-3 left-3 z-10 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
        Vista previa · Widget GOXT
      </div>
      <WidgetEmbedScript apiKey={apiKey} />
    </div>
  )
}
