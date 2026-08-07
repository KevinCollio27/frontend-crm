"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { confirmDialog } from "@/lib/confirm"
import { notify } from "@/lib/notify"
import { teamService } from "@/services/team.service"
import { useIsWorkspaceAdmin } from "@/hooks/useIsWorkspaceAdmin"
import type { InviteLinkRaw } from "@/types/team"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkspaceInviteLinkDialog({ open, onOpenChange }: Props) {
  const isAdmin = useIsWorkspaceAdmin()

  const [loading, setLoading] = React.useState(true)
  const [link, setLink] = React.useState<InviteLinkRaw | null>(null)
  const [generating, setGenerating] = React.useState(false)
  const [toggling, setToggling] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    teamService.getInviteLink()
      .then(setLink)
      .catch(() => setLink(null))
      .finally(() => setLoading(false))
  }, [open])

  const url = link ? `${window.location.origin}/invite/${link.code}` : ""

  async function handleGenerate(isRegenerate: boolean) {
    if (isRegenerate) {
      const confirmed = await confirmDialog({
        title: "¿Regenerar el enlace?",
        description: "El enlace actual dejará de funcionar de inmediato y se reemplaza por uno nuevo.",
        confirmText: "Sí, regenerar",
        cancelText: "Cancelar",
        tone: "warning",
      })
      if (!confirmed) return
    }
    setGenerating(true)
    try {
      const newLink = await teamService.generateInviteLink()
      setLink(newLink)
      notify.success({
        title: isRegenerate ? "Enlace regenerado" : "Enlace generado",
        description: "El enlace de invitación está listo para compartir.",
      })
    } catch {
      notify.error({ title: "Algo salió mal", description: "No se pudo generar el enlace." })
    } finally {
      setGenerating(false)
    }
  }

  async function handleToggle(checked: boolean) {
    if (!link) return
    setToggling(true)
    const previous = link
    setLink({ ...link, is_active: checked })
    try {
      const updated = await teamService.toggleInviteLink()
      setLink(updated)
    } catch {
      setLink(previous)
      notify.error({ title: "Algo salió mal", description: "No se pudo actualizar el enlace." })
    } finally {
      setToggling(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enlace de invitación</DialogTitle>
          <DialogDescription>
            Comparte este enlace para que cualquier persona pueda unirse a tu workspace.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !link ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "No hay enlace generado aún." : "El administrador del workspace aún no generó un enlace de invitación."}
            </p>
            {isAdmin && (
              <Button className="w-full" onClick={() => handleGenerate(false)} disabled={generating}>
                {generating && <Loader2Icon className="size-4 animate-spin" />}
                Generar enlace
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Enlace</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={link.is_active ? url : "Enlace desactivado"}
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={handleCopy}
                  disabled={!link.is_active}
                  aria-label="Copiar enlace"
                >
                  {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                </Button>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Enlace activo</p>
                  <p className="text-xs text-muted-foreground">
                    {link.is_active ? "Cualquiera con el enlace puede unirse." : "El enlace no admite nuevas uniones."}
                  </p>
                </div>
                <Switch checked={link.is_active} onCheckedChange={handleToggle} disabled={toggling} />
              </div>
            )}
          </div>
        )}

        {link && isAdmin && (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleGenerate(true)} disabled={generating}>
              <RefreshCwIcon className="size-4" />
              Regenerar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
