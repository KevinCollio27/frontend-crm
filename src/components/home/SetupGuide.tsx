"use client"

import * as React from "react"
import {
  ArrowRightIcon,
  Building2Icon,
  CalendarIcon,
  CheckIcon,
  FileTextIcon,
  PlayCircleIcon,
  TrendingUpIcon,
  UserIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Step {
  key: string
  title: string
  icon: React.ElementType
  description: string
  whyUseful: string
  dataNeeded: string[]
  ctaLabel: string
  ctaHref: string
}

const steps: Step[] = [
  {
    key: "organization",
    title: "Crea tu primera Organización",
    icon: Building2Icon,
    description: "Las organizaciones son las empresas o instituciones con las que trabajas.",
    whyUseful: "Al crearlas primero, podrás asociar tus contactos y mantener tu pipeline de ventas ordenado.",
    dataNeeded: ["Nombre (obligatorio)", "RUT / ID Fiscal", "Industria", "Ciudad"],
    ctaLabel: "Ir a Organizaciones",
    ctaHref: "/crm/organizations",
  },
  {
    key: "contact",
    title: "Crea tu primer Contacto",
    icon: UserIcon,
    description: "Los contactos son las personas con las que haces negocios.",
    whyUseful: "Centraliza la información de tus clientes y potenciales para gestionar mejor tus relaciones comerciales.",
    dataNeeded: ["Nombre (obligatorio)", "Correo electrónico", "Teléfono", "Empresa asociada"],
    ctaLabel: "Ir a Contactos",
    ctaHref: "/crm/contacts",
  },
  {
    key: "opportunity",
    title: "Crea tu primera Oportunidad",
    icon: TrendingUpIcon,
    description: "Las oportunidades representan negocios en curso dentro de tu embudo de ventas.",
    whyUseful: "Permite hacer seguimiento del estado de cada trato y proyectar ingresos futuros.",
    dataNeeded: ["Nombre (obligatorio)", "Etapa del embudo", "Contacto asociado", "Valor estimado"],
    ctaLabel: "Ir al Embudo",
    ctaHref: "/crm/funnels",
  },
  {
    key: "activity",
    title: "Registra tu primera Actividad",
    icon: CalendarIcon,
    description: "Las actividades son las acciones de seguimiento que realizas con tus contactos.",
    whyUseful: "Mantén un registro de llamadas, reuniones y tareas para no perder ningún seguimiento importante.",
    dataNeeded: ["Tipo de actividad", "Fecha y hora", "Contacto u oportunidad asociada", "Notas"],
    ctaLabel: "Ir a Actividades",
    ctaHref: "/crm/activities",
  },
  {
    key: "quotation",
    title: "Crea tu primera Cotización",
    icon: FileTextIcon,
    description: "Las cotizaciones te permiten enviar propuestas formales a tus clientes.",
    whyUseful: "Genera documentos profesionales con tus productos y precios directamente desde el CRM.",
    dataNeeded: ["Oportunidad asociada", "Productos", "Precios y cantidades", "Validez de la oferta"],
    ctaLabel: "Ir a Documentos",
    ctaHref: "/crm/documents",
  },
]

type StepState = { completed: boolean; skipped: boolean }

export function SetupGuide() {
  const [stepStates, setStepStates] = React.useState<Record<string, StepState>>(
    Object.fromEntries(steps.map((s) => [s.key, { completed: false, skipped: false }]))
  )
  const [dismissed, setDismissed] = React.useState(false)

  const completedCount = steps.filter((s) => stepStates[s.key].completed).length
  const allDone = completedCount === steps.length
  const progress = (completedCount / steps.length) * 100

  const activeStep = steps.find(
    (s) => !stepStates[s.key].completed && !stepStates[s.key].skipped
  )

  function markComplete(key: string) {
    setStepStates((prev) => ({ ...prev, [key]: { completed: true, skipped: false } }))
  }

  function skipStep(key: string) {
    setStepStates((prev) => ({ ...prev, [key]: { ...prev[key], skipped: true } }))
  }

  if (dismissed) return null

  return (
    <Card className="overflow-hidden gap-0 pb-0">
      <CardHeader className="gap-3 px-8 pt-7 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border bg-muted/50 p-2">
            <img src="/images/goxt-negro.png" alt="GOxT CRM" className="size-full object-contain" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-medium tracking-tight">
              {allDone ? "¡Todo listo! 🎉" : "Bienvenido a GOxT CRM"}
            </h2>
            <p className="text-base text-muted-foreground">
              {allDone
                ? "Completaste todos los pasos. Ya tienes lo necesario para gestionar tu proceso de ventas."
                : "Completa estos pasos para sacarle el máximo provecho a tu plataforma."}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} de {steps.length} pasos completados
            </span>
            <span className="font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col px-0 pb-0">
        {steps.map((step, index) => {
          const state = stepStates[step.key]
          const isActive = activeStep?.key === step.key
          const Icon = step.icon

          return (
            <div
              key={step.key}
              className={cn(
                "relative isolate border-t px-6 py-4 sm:px-8",
                isActive && "bg-muted/40"
              )}
            >
              {/* Dashed decorative line */}
              <div
                className={cn(
                  "absolute inset-y-0 left-12 -z-1 border-r border-dashed",
                  state.completed ? "border-primary/25" : "border-border/60"
                )}
              />

              <div className="flex items-start gap-4">
                {/* Step icon */}
                <div
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                    state.completed
                      ? "bg-primary"
                      : isActive
                      ? "border-2 border-primary bg-primary/10"
                      : "border border-dashed border-muted-foreground/40 bg-muted"
                  )}
                >
                  {state.completed ? (
                    <CheckIcon className="size-4 text-primary-foreground" />
                  ) : (
                    <Icon
                      className={cn(
                        "size-4",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3
                      className={cn(
                        "text-sm font-medium",
                        state.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </h3>
                    {state.completed && (
                      <Badge className="shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">Completado</Badge>
                    )}
                    {!state.completed && !isActive && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Paso {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Expanded content for active step */}
                  {isActive && (
                    <div className="mt-3 space-y-3">
                      <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 space-y-2 text-sm">
                        <p className="font-semibold text-amber-900">📌 ¿Para qué sirve?</p>
                        <p className="text-amber-800 leading-relaxed">{step.description} {step.whyUseful}</p>
                        <div>
                          <p className="font-semibold text-amber-900">Datos que necesitarás:</p>
                          <ul className="mt-1.5 space-y-1">
                            {step.dataNeeded.map((d) => (
                              <li key={d} className="flex items-center gap-2 text-amber-800">
                                <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <div className="relative mr-auto">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled
                            className="gap-1.5 text-muted-foreground"
                          >
                            <PlayCircleIcon className="size-4" />
                            Mira el video
                          </Button>
                          <span className="absolute -top-2 -right-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
                            pronto
                          </span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => skipStep(step.key)}>
                          Omitir
                        </Button>
                        <Button size="sm" onClick={() => markComplete(step.key)}>
                          {step.ctaLabel}
                          <ArrowRightIcon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Footer */}
        <div className="border-t px-8 py-4 flex items-center justify-between">
          {allDone ? (
            <Button>
              Ir al Embudo
              <ArrowRightIcon className="size-4" />
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
            >
              ¿Ya conoces la plataforma? Omitir tutorial completo
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
