import { ExternalLinkIcon, MailIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock de referencia — "Correo Nuevo". A diferencia de Formularios/WhatsApp (datos
// propios en BD), esto representa la bandeja de Gmail en vivo (mismo mecanismo que ya
// usa MiniCalendarCard para el calendario). Fila calcada de MailList.tsx (la bandeja real
// en /crm/mail) — nombre con punto azul si no está leído, asunto, preview de 2 líneas y
// hora relativa — para no reinventar un estilo que ya existe. Hardcodeado, sin conectar.
interface MailRow {
  sender: string
  subject: string
  preview: string
  time: string
  unread: boolean
}

const MAILS: MailRow[] = [
  { sender: "Juan Pérez",      subject: "Consulta sobre cotización",      preview: "Hola, quería confirmar el valor final de la cotización que enviaron la semana pasada...", time: "Hace 10 min", unread: true  },
  { sender: "María Soto",      subject: "Re: Contrato Anual Camanchaca",  preview: "Perfecto, quedamos así entonces. Cualquier cosa me avisas.",                              time: "Hace 2 h",     unread: true  },
  { sender: "Google Calendar", subject: "Recordatorio: Reunión mañana",   preview: "Tu reunión 'Seguimiento comercial' comienza en 1 día.",                                   time: "Hace 3 h",     unread: false },
  { sender: "Pablo Ibaceta",   subject: "Documentos adjuntos",            preview: "Te dejo los documentos que me solicitaste, cualquier duda me dices.",                     time: "Ayer",         unread: false },
]

export function ReferenceCardExample16() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#131313]">
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
        <MailIcon className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Correo</p>
          <p className="text-base font-semibold text-white">Bandeja de Entrada</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-neutral-800 border-t border-neutral-800">
        {MAILS.map((m, i) => (
          <div key={i} className="flex items-start gap-3 px-6 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-1.5">
                {m.unread && <span className="size-2 shrink-0 rounded-full bg-blue-500" />}
                <span className={cn("truncate text-sm", m.unread ? "font-semibold text-white" : "font-medium text-neutral-300")}>
                  {m.sender}
                </span>
              </div>
              <p className={cn("truncate text-sm", m.unread ? "font-medium text-neutral-200" : "text-neutral-400")}>
                {m.subject}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{m.preview}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-xs text-neutral-500">{m.time}</span>
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
