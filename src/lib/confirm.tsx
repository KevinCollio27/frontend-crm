"use client"

import { useEffect, useState } from "react";
import { AlertTriangle, Ban, type LucideIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Tone = "danger" | "warning" | "info" | "block";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: Tone;
  /** Si es true, oculta el botón de cancelar y muestra solo "Entendido". */
  blocking?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

type Listener = (req: ConfirmRequest) => void;
let listener: Listener | null = null;
let counter = 0;

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!listener) {
      console.warn("ConfirmHost no está montado");
      resolve(false);
      return;
    }
    listener({ ...options, id: ++counter, resolve });
  });
}

// Helpers específicos para autenticación
export const authConfirm = {
  logout: () =>
    confirmDialog({
      title: "¿Estás seguro de salir?",
      description: "No te preocupes, puedes retomarlo después.",
      confirmText: "Sí, salir",
      cancelText: "Cancelar",
      tone: "info",
    }),
};

// Helpers específicos para CRUD de oportunidades
export const opportunityConfirm = {
  delete: (name?: string) =>
    confirmDialog({
      title: "¿Seguro de que quieres eliminar?",
      description: name
        ? `Vas a eliminar "${name}". Esta acción es irreversible.`
        : "Esta acción es irreversible.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
};

// Helpers específicos para integraciones
export const integrationConfirm = {
  disconnect: (name?: string) =>
    confirmDialog({
      title: "¿Desconectar esta integración?",
      description: name
        ? `Se eliminará la conexión con ${name}. Tendrás que volver a ingresar las credenciales para reconectarla.`
        : "Tendrás que volver a ingresar las credenciales para reconectarla.",
      confirmText: "Sí, desconectar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
};

// Helpers específicos para CRUD de actividades
export const activityConfirm = {
  delete: (title?: string) =>
    confirmDialog({
      title: "¿Seguro de que quieres eliminar?",
      description: title
        ? `Vas a eliminar "${title}". Esta acción es irreversible.`
        : "Esta acción es irreversible.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
};

// Helpers específicos para eventos de Google Calendar
export const googleEventConfirm = {
  cancel: (title?: string) =>
    confirmDialog({
      title: "¿Cancelar esta reunión?",
      description: title
        ? `Se cancelará "${title}" en Google Calendar y se notificará a los invitados.`
        : "Se cancelará en Google Calendar y se notificará a los invitados.",
      confirmText: "Sí, cancelar",
      cancelText: "Volver",
      tone: "danger",
    }),
};

// Helpers específicos para CRUD de organizaciones
export const orgConfirm = {
  delete: (name?: string) =>
    confirmDialog({
      title: "¿Seguro de que quieres eliminar?",
      description: name
        ? `Vas a eliminar "${name}". Esta acción es irreversible.`
        : "Esta acción es irreversible.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
  blockedByOpportunity: (name?: string) =>
    confirmDialog({
      title: "No puedes eliminar",
      description: name
        ? `"${name}" está ligada con una oportunidad. Desvincúlala antes de eliminarla.`
        : "Esta organización está ligada con una oportunidad.",
      confirmText: "Entendido",
      tone: "block",
      blocking: true,
    }),
  merge: (count: number, survivorName?: string) =>
    confirmDialog({
      title: "¿Fusionar organizaciones?",
      description: survivorName
        ? `Vas a fusionar ${count} organizaciones en "${survivorName}". Las demás quedarán archivadas (no se borran) y esto no se puede deshacer desde la interfaz.`
        : `Vas a fusionar ${count} organizaciones. Las demás quedarán archivadas (no se borran) y esto no se puede deshacer desde la interfaz.`,
      confirmText: "Sí, fusionar",
      cancelText: "Cancelar",
      tone: "warning",
    }),
};

// Helpers específicos para CRUD de contactos
export const contactConfirm = {
  delete: (name?: string) =>
    confirmDialog({
      title: "¿Seguro de que quieres eliminar?",
      description: name
        ? `Vas a eliminar a "${name}". Esta acción es irreversible.`
        : "Esta acción es irreversible.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
  blockedByOpportunity: (name?: string, count?: number) =>
    confirmDialog({
      title: "No puedes eliminar",
      description: name
        ? `"${name}" tiene ${count ?? "una o más"} oportunidad${(count ?? 2) > 1 ? "es" : ""} asociada${(count ?? 2) > 1 ? "s" : ""}. Desvincúlalas antes de eliminar.`
        : "Este contacto tiene oportunidades asociadas.",
      confirmText: "Entendido",
      tone: "block",
      blocking: true,
    }),
  merge: (count: number, survivorName?: string) =>
    confirmDialog({
      title: "¿Fusionar contactos?",
      description: survivorName
        ? `Vas a fusionar ${count} contactos en "${survivorName}". Los demás quedarán archivados (no se borran) y esto no se puede deshacer desde la interfaz.`
        : `Vas a fusionar ${count} contactos. Los demás quedarán archivados (no se borran) y esto no se puede deshacer desde la interfaz.`,
      confirmText: "Sí, fusionar",
      cancelText: "Cancelar",
      tone: "warning",
    }),
  unlink: (name?: string, orgName?: string) =>
    confirmDialog({
      title: "¿Desvincular contacto?",
      description: name
        ? `"${name}" dejará de estar asociado a ${orgName ?? "esta organización"}.`
        : `Este contacto dejará de estar asociado a ${orgName ?? "esta organización"}.`,
      confirmText: "Sí, desvincular",
      cancelText: "Cancelar",
      tone: "warning",
    }),
};

// Helpers específicos para CRUD de embudos
export const flowConfirm = {
  delete: (name?: string) =>
    confirmDialog({
      title: "¿Seguro de que quieres eliminar?",
      description: name
        ? `Vas a eliminar el embudo "${name}" junto con todas sus etapas. Esta acción es irreversible.`
        : "Esta acción es irreversible.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
  // No es un bloqueo seco: se ofrece desactivar en su lugar (igual que el CRM anterior).
  blockedOfferDeactivate: (message?: string) =>
    confirmDialog({
      title: "No puedes eliminar este embudo",
      description: `${message ?? "Este embudo tiene oportunidades asociadas."} ¿Quieres desactivarlo en su lugar?`,
      confirmText: "Desactivar",
      cancelText: "Cancelar",
      tone: "warning",
    }),
};

// Helpers específicos para CRUD de productos
export const productConfirm = {
  delete: (name?: string) =>
    confirmDialog({
      title: "¿Seguro de que quieres eliminar?",
      description: name
        ? `Vas a eliminar "${name}". Esta acción es irreversible.`
        : "Esta acción es irreversible.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
  blockedByOpportunity: (message?: string) =>
    confirmDialog({
      title: "No puedes eliminar",
      description: message ?? "Este producto tiene oportunidades asociadas.",
      confirmText: "Entendido",
      tone: "block",
      blocking: true,
    }),
};

// Helpers específicos para cotizaciones
export const quotationConfirm = {
  sendToCargo: () =>
    confirmDialog({
      title: "¿Estás seguro de enviar a Cargo?",
      description: "Esta cotización será enviada a Cargo para poder hacer la gestión operacional.",
      confirmText: "Sí, enviar",
      cancelText: "No",
      tone: "info",
    }),
};

// Helpers específicos para CRUD de opciones de catálogo
export const catalogConfirm = {
  deleteOption: (name?: string) =>
    confirmDialog({
      title: "¿Seguro de que quieres eliminar esta opción?",
      description: name
        ? `Vas a eliminar "${name}". Esta acción es irreversible.`
        : "Esta acción es irreversible.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
};

// Helpers específicos para CRUD de plantillas PDF
export const pdfTemplateConfirm = {
  delete: (name?: string, isDefault?: boolean) =>
    confirmDialog({
      title: "¿Seguro de que quieres eliminar esta plantilla?",
      description: [
        name ? `Vas a eliminar "${name}". Esta acción es irreversible.` : "Esta acción es irreversible.",
        isDefault ? "Es la plantilla predeterminada del workspace — al eliminarla, quedará sin default hasta que marques otra." : null,
        "Si está asignada a alguna cotización u oportunidad, esa asignación pasa sola al siguiente nivel (oportunidad o predeterminada del workspace).",
      ].filter(Boolean).join(" "),
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
};

// Helpers específicos para CRUD de plantillas WhatsApp
export const whatsappTemplateConfirm = {
  delete: (name?: string) =>
    confirmDialog({
      title: "¿Seguro de que quieres eliminar este template?",
      description: [
        name ? `Vas a eliminar "${name}" de Meta y del cache local.` : "Esta acción es irreversible.",
        "El nombre quedará bloqueado por 30 días antes de poder reutilizarlo.",
      ].filter(Boolean).join(" "),
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    }),
};

const toneConfig: Record<Tone, { icon: LucideIcon; iconWrap: string; confirmBtn: string }> = {
  danger: {
    icon: AlertTriangle,
    iconWrap: "bg-destructive/15 text-destructive",
    confirmBtn: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-[oklch(0.55_0.15_65)]/15 text-[oklch(0.55_0.15_65)]",
    confirmBtn: "",
  },
  info: {
    icon: AlertTriangle,
    iconWrap: "bg-primary/15 text-primary",
    confirmBtn: "",
  },
  block: {
    icon: Ban,
    iconWrap: "bg-muted text-muted-foreground",
    confirmBtn: "",
  },
};

export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listener = (r) => {
      setReq(r);
      setOpen(true);
    };
    return () => {
      listener = null;
    };
  }, []);

  const tone = req?.tone ?? "danger";
  const cfg = toneConfig[tone];
  const Icon = cfg.icon;

  function handleResolve(value: boolean) {
    req?.resolve(value);
    setOpen(false);
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleResolve(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                cfg.iconWrap,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle>{req?.title}</AlertDialogTitle>
              {req?.description ? (
                <AlertDialogDescription className="mt-1 text-wrap">
                  {req.description}
                </AlertDialogDescription>
              ) : null}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!req?.blocking ? (
            <AlertDialogCancel onClick={() => handleResolve(false)}>
              {req?.cancelText ?? "Cancelar"}
            </AlertDialogCancel>
          ) : null}
          <AlertDialogAction
            className={cfg.confirmBtn}
            onClick={() => handleResolve(true)}
          >
            {req?.confirmText ?? "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}