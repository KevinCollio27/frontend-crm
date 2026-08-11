"use client"

import * as React from "react"
import { AlertTriangleIcon, Loader2Icon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { workspaceService } from "@/services/workspace.service"
import { notify } from "@/lib/notify"
import { useSessionStore } from "@/store/session.store"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceName: string
}

export function DeleteWorkspaceSheet({ open, onOpenChange, workspaceName }: Props) {
  const [confirmText, setConfirmText] = React.useState("")
  const [deleting, setDeleting] = React.useState(false)
  const canDelete = confirmText.trim() === workspaceName.trim()

  React.useEffect(() => {
    if (open) setConfirmText("")
  }, [open])

  async function handleDelete() {
    if (!canDelete) return
    setDeleting(true)
    try {
      await workspaceService.deactivate()

      // Refresca la sesión — el workspace recién eliminado ya no viene en
      // user_workspace (el backend filtra por is_active/is_deleted real).
      await useSessionStore.getState().hydrate()
      const user = useSessionStore.getState().user
      const remaining = user?.user_workspace ?? []

      if (remaining.length > 0) {
        // Te quedan otros workspaces — te cambiamos al primero automáticamente,
        // sin preguntar nada.
        const next = remaining[0]
        await fetch("/api/auth/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: next.workspace_id }),
        })
        useSessionStore.getState().setSession(user!, next.workspace_id)
        const nextName = next.workspace?.name ?? ""
        window.location.href = `/chat?welcome=workspace-deleted&name=${encodeURIComponent(nextName)}`
      } else {
        // Era tu único workspace — te dejamos sin ninguno activo, lo que hace que
        // el middleware te mande solo a la pantalla de crear uno nuevo (ahí también
        // agregamos un link para cerrar sesión, por si prefieres eso).
        await fetch("/api/auth/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: null }),
        })
        useSessionStore.getState().setSession(user!, null)
        window.location.href = "/create-workspace?notice=workspace-deleted"
      }
    } catch {
      notify.error({ title: "No se pudo eliminar", description: "Intenta de nuevo en unos segundos." })
      setDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 480, padding: 0, gap: 0 }}
        className="flex w-full flex-col"
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0 space-y-0.5">
            <SheetTitle>Eliminar Workspace</SheetTitle>
            <SheetDescription>Esta acción no se puede deshacer</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-destructive uppercase">
              <AlertTriangleIcon className="size-3" /> Ojo con esto
            </p>
            <p className="text-sm">
              Vas a borrar <strong>&ldquo;{workspaceName}&rdquo;</strong> para siempre. Se pierde todo lo que hay
              adentro — contactos, organizaciones, negocios, todo — y ni tú ni nadie de tu equipo va a poder
              volver a entrar aquí. No hay un botón para deshacer esto después.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-workspace-name">Para confirmar, escribe el nombre del workspace:</Label>
            <p className="truncate rounded-md bg-muted px-2.5 py-1.5 text-sm font-medium" title={workspaceName}>
              {workspaceName}
            </p>
            <Input
              id="confirm-workspace-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={workspaceName}
              autoComplete="off"
              disabled={deleting}
            />
          </div>
        </div>

        <div className="border-t p-4">
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={!canDelete || deleting}
            onClick={handleDelete}
          >
            {deleting && <Loader2Icon className="size-4 animate-spin" />}
            Eliminar workspace para siempre
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
