import { ClipboardListIcon, ExternalLinkIcon } from "lucide-react"

// Mock de referencia — "Nuevas Respuestas de Formulario". Mismo tratamiento de header
// que el resto (ícono + label/título) y lista con divide-y como Ref9 (Upcoming
// Appointments). Contenido inspirado en datos reales vistos por MCP (widget_form_answer),
// pero hardcodeado — sin conectar, para previsualizar el layout antes de construir el real.
// "Ver Detalles" es solo visual acá — en la versión real, ojo: no existe todavía un tab
// de Formularios en el detalle de oportunidad, así que ese botón llevaría a la
// oportunidad en general, no a la respuesta puntual (gap a resolver aparte).
interface FormAnswerRow {
  form: string
  opportunity: string
  preview: string
  time: string
}

// preview = extracto de las respuestas (answers) del formulario — mismo criterio que
// el preview de Correo, para igualar la densidad de las filas.
const ANSWERS: FormAnswerRow[] = [
  { form: "Formulario de Soporte",                 opportunity: "Rodrigo",                                       preview: "Motivo: Otro — igual que Prohabla",                    time: "Hace 2 días"    },
  { form: "Formulario de Contacto",                opportunity: "Kevin Collio",                                  preview: "Sin respuestas adicionales en este formulario.",       time: "Hace 3 semanas" },
  { form: "Solicitud de API para integración GPS", opportunity: "Patricia Madrid Torres - TRANSTURBO CHILE SPA", preview: "RUT: 77.043.058-5 — Empresa: TRANSTURBO CHILE SPA",    time: "Hace 3 semanas" },
  { form: "Solicitud de API para integración GPS", opportunity: "Cesar Merino Carvajal - Transportes Artisa",    preview: "RUT: 78.161.690-7 — Empresa: Transportes Artisa Ltda", time: "Hace 4 semanas" },
]

export function ReferenceCardExample14() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#131313]">
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
        <ClipboardListIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Formularios</p>
          <p className="text-base font-semibold text-white">Nuevas Respuestas</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-neutral-800 border-t border-neutral-800">
        {ANSWERS.map((a, i) => (
          <div key={i} className="flex items-start gap-3 px-6 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{a.form}</p>
              <p className="truncate text-xs text-neutral-400">{a.opportunity}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{a.preview}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-xs text-neutral-500">{a.time}</span>
              <button type="button" className="text-neutral-500 hover:text-white" title="Ver Detalles">
                <ExternalLinkIcon className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
