import { toast as sonnerToast } from "sonner";
import { CheckCircle2, Info, XOctagon, AlertTriangle, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "info" | "warning";

interface NotifyOptions {
  title: string;
  description?: string;
  duration?: number;
}

const variantConfig: Record<
  Variant,
  { icon: LucideIcon; container: string; iconWrap: string; closeBtn: string }
> = {
  success: {
    icon: CheckCircle2,
    container: "bg-[oklch(0.45_0.12_165)] text-white dark:bg-[oklch(0.38_0.11_165)]",
    iconWrap: "bg-[oklch(0.55_0.14_165)]",
    closeBtn: "border-white/30 hover:bg-white/10",
  },
  error: {
    icon: XOctagon,
    container: "bg-[oklch(0.45_0.16_25)] text-white dark:bg-[oklch(0.38_0.15_25)]",
    iconWrap: "bg-[oklch(0.55_0.18_25)]",
    closeBtn: "border-white/30 hover:bg-white/10",
  },
  info: {
    icon: Info,
    container: "bg-[oklch(0.42_0.13_245)] text-white dark:bg-[oklch(0.36_0.12_245)]",
    iconWrap: "bg-[oklch(0.55_0.16_245)]",
    closeBtn: "border-white/30 hover:bg-white/10",
  },
  warning: {
    icon: AlertTriangle,
    container: "bg-[oklch(0.55_0.15_65)] text-white dark:bg-[oklch(0.48_0.14_65)]",
    iconWrap: "bg-[oklch(0.65_0.17_65)]",
    closeBtn: "border-white/30 hover:bg-white/10",
  },
};

function FlashToast({
  variant,
  title,
  description,
  onClose,
}: {
  variant: Variant;
  title: string;
  description?: string;
  onClose: () => void;
}) {
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-90 max-w-[92vw] items-center gap-3 rounded-full py-2 pl-2 pr-2 shadow-xl",
        cfg.container,
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          cfg.iconWrap,
        )}
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-sm font-semibold leading-tight">{title}</p>
        {description ? (
          <p className="truncate text-xs leading-tight text-white/85">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
          cfg.closeBtn,
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function show(variant: Variant, { title, description, duration = 4000 }: NotifyOptions) {
  return sonnerToast.custom(
    (id) => (
      <FlashToast
        variant={variant}
        title={title}
        description={description}
        onClose={() => sonnerToast.dismiss(id)}
      />
    ),
    { duration },
  );
}

export const notify = {
  success: (opts: NotifyOptions) => show("success", opts),
  error:   (opts: NotifyOptions) => show("error", opts),
  info:    (opts: NotifyOptions) => show("info", opts),
  warning: (opts: NotifyOptions) => show("warning", opts),
  dismiss: sonnerToast.dismiss,
};

export const opportunityNotify = {
  created: (name?: string) =>
    notify.success({
      title: "Oportunidad creada",
      description: name ? `"${name}" se creó correctamente.` : "Se creó correctamente.",
    }),
  updated: (name?: string) =>
    notify.info({
      title: "Oportunidad actualizada",
      description: name ? `"${name}" se actualizó correctamente.` : "Cambios guardados.",
    }),
  deleted: (name?: string) =>
    notify.success({
      title: "Oportunidad eliminada",
      description: name ? `"${name}" fue eliminada correctamente.` : "Se eliminó correctamente.",
    }),
  won: (name?: string) =>
    notify.success({
      title: "Oportunidad ganada",
      description: name ? `"${name}" marcada como Ganada.` : "Marcada como Ganada.",
    }),
  lost: (name?: string) =>
    notify.warning({
      title: "Oportunidad perdida",
      description: name ? `"${name}" marcada como Perdida.` : "Marcada como Perdida.",
    }),
  reopened: (name?: string) =>
    notify.info({
      title: "Oportunidad reabierta",
      description: name ? `"${name}" fue reabierta.` : "Reabierta correctamente.",
    }),
  error: (message?: string) =>
    notify.error({
      title: "Algo salió mal",
      description: message ?? "No se pudo completar la acción. Intenta de nuevo.",
    }),
};

export const campaignNotify = {
  sent: (name?: string, count?: number) =>
    notify.success({
      title: "Campaña enviada",
      description: name
        ? `"${name}" enviada a ${count ?? 0} destinatario(s).`
        : "Campaña enviada correctamente.",
    }),
  error: (message?: string) =>
    notify.error({
      title: "Error al enviar campaña",
      description: message ?? "No se pudo enviar. Intenta de nuevo.",
    }),
};

export const widgetNotify = {
  created: (name?: string) =>
    notify.success({
      title: "Widget creado",
      description: name ? `"${name}" se creó correctamente.` : "Se creó correctamente.",
    }),
  updated: (name?: string) =>
    notify.info({
      title: "Widget actualizado",
      description: name ? `"${name}" se actualizó correctamente.` : "Cambios guardados.",
    }),
  error: (message?: string) =>
    notify.error({
      title: "Algo salió mal",
      description: message ?? "No se pudo completar la acción. Intenta de nuevo.",
    }),
}

export const catalogNotify = {
  created: () =>
    notify.success({ title: "Opción creada", description: "Se agregó correctamente." }),
  updated: () =>
    notify.info({ title: "Opción actualizada", description: "Cambios guardados." }),
  deleted: (name?: string) =>
    notify.success({
      title: "Opción eliminada",
      description: name ? `"${name}" fue eliminada correctamente.` : "Se eliminó correctamente.",
    }),
  activated: (name?: string) =>
    notify.success({
      title: "Opción activada",
      description: name ? `"${name}" está activa.` : "La opción quedó activa.",
    }),
  deactivated: (name?: string) =>
    notify.info({
      title: "Opción desactivada",
      description: name ? `"${name}" quedó desactivada.` : "La opción quedó desactivada.",
    }),
  error: (message?: string) =>
    notify.error({
      title: "Algo salió mal",
      description: message ?? "No se pudo completar la acción. Intenta de nuevo.",
    }),
};

export const integrationNotify = {
  connected: (name?: string) =>
    notify.success({
      title: "Integración conectada",
      description: name ? `${name} quedó conectado correctamente.` : "Se conectó correctamente.",
    }),
  disconnected: (name?: string) =>
    notify.info({
      title: "Integración desconectada",
      description: name ? `${name} quedó desconectado.` : "Se desconectó correctamente.",
    }),
  error: (message?: string) =>
    notify.error({
      title: "Algo salió mal",
      description: message ?? "No se pudo completar la acción. Intenta de nuevo.",
    }),
};

export const suggestionNotify = {
  emailSent: () =>
    notify.success({ title: "Correo enviado", description: "El seguimiento se envió correctamente." }),
  eventCreated: () =>
    notify.success({ title: "Evento agendado", description: "Se creó el evento en Google Calendar." }),
  activityCompleted: () =>
    notify.success({ title: "Actividad completada", description: "Se marcó como completada." }),
  activityRescheduled: () =>
    notify.success({ title: "Actividad reprogramada", description: "Se guardó la nueva fecha." }),
  dismissed: () =>
    notify.info({ title: "Sugerencia descartada", description: "No volverá a aparecer por unos días." }),
  noIntegration: (name: string) =>
    notify.warning({
      title: "Falta conectar una integración",
      description: `Conecta ${name} en Integraciones para poder aplicar esta sugerencia.`,
    }),
  error: (message?: string) =>
    notify.error({
      title: "No se pudo aplicar la sugerencia",
      description: message ?? "Intenta de nuevo.",
    }),
};

export const flowNotify = {
  created: (name?: string) =>
    notify.success({
      title: "Embudo creado",
      description: name ? `"${name}" se creó correctamente.` : "Se creó correctamente.",
    }),
  updated: (name?: string) =>
    notify.info({
      title: "Embudo actualizado",
      description: name ? `"${name}" se actualizó correctamente.` : "Cambios guardados.",
    }),
  deleted: (name?: string) =>
    notify.success({
      title: "Embudo eliminado",
      description: name ? `"${name}" fue eliminado correctamente.` : "Se eliminó correctamente.",
    }),
  activated: (name?: string) =>
    notify.success({
      title: "Embudo activado",
      description: name ? `"${name}" está activo.` : "El embudo quedó activo.",
    }),
  deactivated: (name?: string) =>
    notify.info({
      title: "Embudo desactivado",
      description: name ? `"${name}" quedó desactivado.` : "El embudo quedó desactivado.",
    }),
  error: (message?: string) =>
    notify.error({
      title: "Algo salió mal",
      description: message ?? "No se pudo completar la acción. Intenta de nuevo.",
    }),
};

export const productNotify = {
  created: (name?: string) =>
    notify.success({
      title: "Producto creado",
      description: name ? `"${name}" se creó correctamente.` : "Se creó correctamente.",
    }),
  updated: (name?: string) =>
    notify.info({
      title: "Producto actualizado",
      description: name ? `"${name}" se actualizó correctamente.` : "Cambios guardados.",
    }),
  deleted: (name?: string) =>
    notify.success({
      title: "Producto eliminado",
      description: name ? `"${name}" fue eliminado correctamente.` : "Se eliminó correctamente.",
    }),
  error: (message?: string) =>
    notify.error({
      title: "Algo salió mal",
      description: message ?? "No se pudo completar la acción. Intenta de nuevo.",
    }),
};

export const orgNotify = {
  created: (name?: string) =>
    notify.success({
      title: "Organización creada",
      description: name ? `"${name}" se creó correctamente.` : "Se creó correctamente.",
    }),
  updated: (name?: string) =>
    notify.info({
      title: "Organización actualizada",
      description: name ? `"${name}" se actualizó correctamente.` : "Cambios guardados.",
    }),
  deleted: (name?: string) =>
    notify.success({
      title: "Organización eliminada",
      description: name ? `"${name}" fue eliminada correctamente.` : "Se eliminó correctamente.",
    }),
  merged: (count: number, name?: string) =>
    notify.success({
      title: "Organizaciones fusionadas",
      description: name
        ? `${count} organizaciones se fusionaron en "${name}".`
        : `${count} organizaciones se fusionaron correctamente.`,
    }),
  error: (message?: string) =>
    notify.error({
      title: "Algo salió mal",
      description: message ?? "No se pudo completar la acción. Intenta de nuevo.",
    }),
};
