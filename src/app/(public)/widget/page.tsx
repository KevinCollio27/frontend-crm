"use client"

import { useSearchParams } from "next/navigation"
import { CircleHelpIcon } from "lucide-react"
import { ContactWidgetForm } from "./_components/ContactWidgetForm"

export default function WidgetPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const flow = searchParams.get("flow")

  if (!token || !flow) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted px-4 text-center dark:bg-background">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <CircleHelpIcon className="size-8 text-red-500 dark:text-red-400" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold">Enlace inválido</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Este enlace no tiene los parámetros necesarios para mostrar el formulario.
          </p>
        </div>
      </div>
    )
  }

  return <ContactWidgetForm token={token} flowId={Number(flow)} />
}
