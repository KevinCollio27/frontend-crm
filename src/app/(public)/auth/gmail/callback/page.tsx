"use client"

import * as React from "react"
import { CheckCircle2Icon, XCircleIcon } from "lucide-react"

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "Cancelaste la autorización en Google.",
  missing_params: "Google no envió los datos esperados. Intenta de nuevo.",
  callback_failed: "No se pudo completar la conexión. Intenta de nuevo.",
}

// Página que recibe la vuelta del popup de OAuth (abierta por el backend, ver
// integration.controller.ts → handleGmailCallback). Solo avisa a la ventana que la abrió
// y se cierra sola — no forma parte de la navegación normal del CRM.
export default function GmailCallbackPage() {
  const [status, setStatus] = React.useState<"success" | "error">("success")
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get("error")

    if (errorCode) {
      const errorMessage = ERROR_MESSAGES[errorCode] ?? "No se pudo conectar Gmail."
      setStatus("error")
      setMessage(errorMessage)
      window.opener?.postMessage(
        { type: "GMAIL_AUTH_ERROR", message: errorMessage },
        window.location.origin
      )
    } else {
      setStatus("success")
      setMessage("Gmail conectado correctamente.")
      window.opener?.postMessage({ type: "GMAIL_AUTH_SUCCESS" }, window.location.origin)
    }

    const timer = setTimeout(() => window.close(), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-center">
      {status === "success" ? (
        <CheckCircle2Icon className="size-10 text-emerald-500" />
      ) : (
        <XCircleIcon className="size-10 text-destructive" />
      )}
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs text-muted-foreground">Esta ventana se cerrará sola...</p>
    </div>
  )
}
