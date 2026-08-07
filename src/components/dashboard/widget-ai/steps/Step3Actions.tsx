import * as React from "react"
import {
  CalendarIcon,
  HeadphonesIcon,
  Link2Icon,
  PlusIcon,
  SparklesIcon,
  TargetIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { WidgetFormState, WidgetResource } from "../shared/form-state"

const MOCK_FUNNELS = ["Entrante Web", "Prospección B2B", "Nutrición"]
const MOCK_TEAM = ["Equipo Ventas", "Soporte N1", "María Gómez"]

interface Step3ActionsProps {
  form: WidgetFormState
  setForm: React.Dispatch<React.SetStateAction<WidgetFormState>>
}

export function Step3Actions({ form, setForm }: Step3ActionsProps) {
  function addResource() {
    const resource: WidgetResource = { id: `r${Date.now()}`, name: "", url: "" }
    setForm((f) => ({ ...f, resources: [...f.resources, resource] }))
  }

  function updateResource(id: string, patch: Partial<WidgetResource>) {
    setForm((f) => ({ ...f, resources: f.resources.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
  }

  function removeResource(id: string) {
    setForm((f) => ({ ...f, resources: f.resources.filter((x) => x.id !== id) }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-500">Próximamente</p>
          <p className="text-sm text-muted-foreground">
            Esta sección todavía no está conectada al CRM — la dejamos visible para que veas hacia dónde vamos,
            pero por ahora no se puede configurar ni se guarda al crear el widget.
          </p>
        </div>
      </div>

      <div className="pointer-events-none space-y-4 opacity-50 select-none">
      <ActionCard
        icon={CalendarIcon}
        title="Agendar Reunión"
        description="El agente propone horarios y reserva en el calendario conectado."
        enabled={form.actionSchedule}
        onToggle={(v) => setForm((f) => ({ ...f, actionSchedule: v }))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duración por defecto">
            <Select
              value={form.scheduleDuration}
              onValueChange={(v) => setForm((f) => ({ ...f, scheduleDuration: v ?? "30" }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) =>
                    ({ "15": "15 minutos", "30": "30 minutos", "60": "60 minutos" })[v] ?? v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Calendario conectado">
            <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
              Próximamente
            </div>
          </Field>
        </div>
      </ActionCard>

      <ActionCard
        icon={UserPlusIcon}
        title="Capturar Lead en CRM"
        description="Crea un nuevo contacto y lo asigna al embudo correspondiente."
        enabled={form.actionLead}
        onToggle={(v) => setForm((f) => ({ ...f, actionLead: v }))}
      >
        <div className="space-y-4">
          <Field label="Campos a solicitar">
            <div className="flex flex-wrap gap-4">
              {(["nombre", "correo", "telefono"] as const).map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm capitalize">
                  <Checkbox
                    checked={form.leadFields[k]}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, leadFields: { ...f.leadFields, [k]: !!v } }))
                    }
                  />
                  {k === "telefono" ? "Teléfono" : k.charAt(0).toUpperCase() + k.slice(1)}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Asignar a embudo">
            <Select
              value={form.leadFunnel}
              onValueChange={(v) => setForm((f) => ({ ...f, leadFunnel: v ?? "" }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un embudo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {MOCK_FUNNELS.map((funnel) => (
                    <SelectItem key={funnel} value={funnel}>
                      {funnel}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </ActionCard>

      <ActionCard
        icon={TargetIcon}
        title="Crear Oportunidad"
        description="Abre una oportunidad de venta cuando se detecta intención de compra."
        enabled={form.actionOpportunity}
        onToggle={(v) => setForm((f) => ({ ...f, actionOpportunity: v }))}
      >
        <Field label="Intención que dispara la acción">
          <Input
            placeholder="ej. cuando el visitante pide cotización"
            value={form.opportunityTrigger}
            onChange={(e) => setForm((f) => ({ ...f, opportunityTrigger: e.target.value }))}
          />
        </Field>
      </ActionCard>

      <ActionCard
        icon={HeadphonesIcon}
        title="Transferir a Humano"
        description="Escala la conversación a un agente real cuando hace falta."
        enabled={form.actionHuman}
        onToggle={(v) => setForm((f) => ({ ...f, actionHuman: v }))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cuándo transferir">
            <Select
              value={form.humanWhen}
              onValueChange={(v) => setForm((f) => ({ ...f, humanWhen: v ?? "ambas" }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) =>
                    ({
                      "no-sabe": "Si el bot no sabe responder",
                      pide: "Si el visitante lo pide",
                      ambas: "Ambas",
                    })[v] ?? v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="no-sabe">Si el bot no sabe responder</SelectItem>
                  <SelectItem value="pide">Si el visitante lo pide</SelectItem>
                  <SelectItem value="ambas">Ambas</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notificar a">
            <Select
              value={form.humanWho}
              onValueChange={(v) => setForm((f) => ({ ...f, humanWho: v ?? "" }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {MOCK_TEAM.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </ActionCard>

      <ActionCard
        icon={Link2Icon}
        title="Enviar Documento o Enlace"
        description="Comparte recursos relevantes durante la conversación."
        enabled={form.actionResource}
        onToggle={(v) => setForm((f) => ({ ...f, actionResource: v }))}
      >
        <div className="space-y-2">
          {form.resources.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <Input
                className="w-32 shrink-0"
                value={r.name}
                onChange={(e) => updateResource(r.id, { name: e.target.value })}
                placeholder="Nombre"
              />
              <Input
                value={r.url}
                onChange={(e) => updateResource(r.id, { url: e.target.value })}
                placeholder="https://"
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeResource(r.id)}>
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addResource}>
            <PlusIcon className="size-4" /> Agregar recurso
          </Button>
        </div>
      </ActionCard>
      </div>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  enabled: boolean
  onToggle: (v: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div className={cn("rounded-xl border bg-background transition-colors", enabled && "border-primary/40")}>
      <div className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-md",
            enabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
            </div>
            <Switch checked={enabled} onCheckedChange={onToggle} />
          </div>
        </div>
      </div>
      {enabled && children && (
        <div className="border-t px-4 py-4 pl-16">{children}</div>
      )}
    </div>
  )
}
