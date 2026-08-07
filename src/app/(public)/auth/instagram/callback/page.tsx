"use client"

import * as React from "react"
import { CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { instagramService } from "@/services/instagram.service"

// Página que recibe la vuelta del popup OAuth de Meta para Instagram — mismo mecanismo
// que el callback de WhatsApp (ver WhatsAppCallbackPage): el frontend arma la URL de OAuth
// y también intercambia el code. Es un simple relay: no decide nada, solo avisa a la
// ventana que la abrió (incluyendo el caso "hay que elegir página") y se cierra.
export default function InstagramCallbackPage() {
  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = React.useState("Conectando con Meta...")
  const called = React.useRef(false)

  React.useEffect(() => {
    if (called.current) return
    called.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const error = params.get("error_description") || params.get("error_message") || params.get("error_reason") || params.get("error")

    if (error) {
      setStatus("error")
      setMessage(error)
      window.opener?.postMessage({ type: "INSTAGRAM_AUTH_ERROR", message: error }, window.location.origin)
      setTimeout(() => window.close(), 1500)
      return
    }

    if (!code) {
      setStatus("error")
      setMessage("Meta no envió los datos esperados. Intenta de nuevo.")
      window.opener?.postMessage({ type: "INSTAGRAM_AUTH_ERROR", message: "No llegó ningún code de Meta." }, window.location.origin)
      setTimeout(() => window.close(), 1500)
      return
    }

    const redirectUri = window.location.origin + window.location.pathname
    instagramService
      .completeSignup(code, redirectUri)
      .then((result) => {
        setStatus("success")
        setMessage("Instagram conectado correctamente.")
        window.opener?.postMessage({ type: "INSTAGRAM_AUTH_SUCCESS", ...result }, window.location.origin)
        window.close()
      })
      .catch((err: { message?: string }) => {
        const msg = err?.message ?? "No se pudo completar la conexión con Meta."
        setStatus("error")
        setMessage(msg)
        window.opener?.postMessage({ type: "INSTAGRAM_AUTH_ERROR", message: msg }, window.location.origin)
        setTimeout(() => window.close(), 1500)
      })
  }, [])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-center">
      {status === "loading" ? (
        <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      ) : status === "success" ? (
        <CheckCircle2Icon className="size-10 text-emerald-500" />
      ) : (
        <XCircleIcon className="size-10 text-destructive" />
      )}
      <p className="max-w-sm px-4 text-sm font-medium">{message}</p>
      <p className="text-xs text-muted-foreground">Esta ventana se cerrará sola...</p>
    </div>
  )
}
