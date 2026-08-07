import {
  AlertCircleIcon,
  ClockIcon,
  FileTextIcon,
  StickyNoteIcon,
  TagIcon,
  type LucideIcon,
} from "lucide-react"

// Datos de ejemplo REALES (anonimizados donde correspondía), extraídos en modo lectura de
// CamiónGO / Southway / GOXT — ver AnalisisSugerencias.md. Nada de esto está conectado a
// reglas ni a IA todavía: es solo para validar el layout de 3 columnas antes de construir
// el motor real. Ver SugerenciasIA_Plan.md.

export type SignalType =
  | "sin_contacto"
  | "sin_movimiento"
  | "reunion_sin_seguimiento"
  | "cotizacion_sin_respuesta"
  | "tareas_vencidas"
  | "higiene_datos"

export const SIGNAL_CONFIG: Record<SignalType, { label: string; icon: LucideIcon; className: string; cardClassName: string; textClassName: string }> = {
  sin_contacto: {
    label: "Sin primer contacto",
    icon: ClockIcon,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    cardClassName: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900",
    textClassName: "text-blue-700 dark:text-blue-400",
  },
  sin_movimiento: {
    label: "Sin movimiento",
    icon: ClockIcon,
    className: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    cardClassName: "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900",
    textClassName: "text-violet-700 dark:text-violet-400",
  },
  reunion_sin_seguimiento: {
    label: "Reunión sin seguimiento",
    icon: StickyNoteIcon,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    cardClassName: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900",
    textClassName: "text-emerald-700 dark:text-emerald-400",
  },
  cotizacion_sin_respuesta: {
    label: "Cotización sin respuesta",
    icon: FileTextIcon,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    cardClassName: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
    textClassName: "text-amber-700 dark:text-amber-400",
  },
  tareas_vencidas: {
    label: "Tareas vencidas",
    icon: AlertCircleIcon,
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    cardClassName: "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900",
    textClassName: "text-rose-700 dark:text-rose-400",
  },
  higiene_datos: {
    label: "Higiene de datos",
    icon: TagIcon,
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400",
    cardClassName: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-900",
    textClassName: "text-cyan-700 dark:text-cyan-400",
  },
}

export type Priority = "Alta" | "Media" | "Baja"

export const PRIORITY_CONFIG: Record<Priority, string> = {
  Alta: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  Media: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  Baja: "bg-muted text-muted-foreground border-border",
}

export interface TimelineEvent {
  date: string
  label: string
}

export type ActionType = "email" | "calendar_event" | "status_action" | "activity_task" | "other"

export interface EmailDraft {
  from: string
  to: string // "" cuando no hay correo de contacto — el usuario debe completarlo
  subject: string
  body: string
  signatureName: string
  signatureEmail: string
}

export interface CalendarDraft {
  title: string
  date: string
  time: string
  duration: string
  attendee?: string
  description: string
}

// "Ganada"/"Perdida" — solo llegan acá oportunidades abiertas (is_won/is_lost en false),
// así que siempre son estas 2 opciones. La IA marca una como recomendada, pero el
// usuario elige — no se fuerza la recomendación.
export interface StatusOptions {
  recommendation: "Ganada" | "Perdida"
}

export interface PendingActivity {
  title: string
  dueDate: string
  overdueDays: number
}

export interface MockSuggestion {
  id: string
  opportunityName: string
  organizationName: string
  contactName?: string
  stageName: string
  stageOrder: number
  stageTotal: number
  signal: SignalType
  priority: Priority
  daysAgo: number
  // Col 2 — contexto/evidencia
  amount?: string
  responsible: string
  createdDaysAgo: number
  signalDetail: string
  timeline: TimelineEvent[]
  reason: string
  suggestedActionLabel: string
  // Col 3 — vista previa de la acción
  actionType: ActionType
  emailDraft?: EmailDraft
  calendarDraft?: CalendarDraft
  statusOptions?: StatusOptions
  pendingActivities?: PendingActivity[]
}

export const MOCK_SUGGESTIONS: MockSuggestion[] = [
  {
    id: "mowi",
    opportunityName: "Nave Distribución Combustible - Mowi",
    organizationName: "Mowi",
    contactName: "Sergio Alvarado Burgos",
    stageName: "Negociación",
    stageOrder: 6,
    stageTotal: 7,
    signal: "cotizacion_sin_respuesta",
    priority: "Alta",
    daysAgo: 23,
    amount: "$528.000.000 CLP",
    responsible: "Kevin Collio",
    createdDaysAgo: 44,
    signalDetail: '"COTIZACION # 0032-26 // MOWI - DOÑA MARIELA" · Estado: Enviada · enviada hace 23 días · sin respuesta desde entonces.',
    timeline: [
      { date: "16-jun", label: "Cotización enviada" },
      { date: "16-jun", label: 'Nota: "Reunión vía Teams — revisión de..."' },
      { date: "17-jun", label: "Actividad: Reunión Mowi Chinquihue (completada)" },
    ],
    reason: "Enviaste la cotización hace 23 días y no ha habido respuesta ni seguimiento posterior. Por el monto y la etapa avanzada, vale la pena retomar contacto.",
    suggestedActionLabel: "Enviar correo de seguimiento",
    actionType: "email",
    emailDraft: {
      from: "kevin.collio@goxt.io",
      to: "sergio.alvarado@mowi.com",
      subject: "Seguimiento — Cotización Nave Distribución Combustible",
      body: "Estimado Sergio,\n\nJunto con saludar, quisiéramos saber si tuvieron oportunidad de revisar la propuesta enviada para la distribución de combustible. Quedamos atentos a sus comentarios.\n\nSaludos cordiales,",
      signatureName: "Kevin Collio",
      signatureEmail: "kevin.collio@goxt.io",
    },
  },
  {
    id: "aharo",
    opportunityName: "Reunión AHaro Multi-X",
    organizationName: "Multi-X S.A.",
    contactName: "Alejandro Haro",
    stageName: "Levantamiento necesidad",
    stageOrder: 3,
    stageTotal: 7,
    signal: "reunion_sin_seguimiento",
    priority: "Media",
    daysAgo: 21,
    responsible: "Kevin Collio",
    createdDaysAgo: 23,
    signalDetail: 'Nota de la reunión: "Posicionar a Southconnect como un aliado logístico capaz de acompañar el crecimiento de Multi-X..." — sin correo ni actividad desde entonces.',
    timeline: [
      { date: "06-jul", label: "Actividad: Solicitud de reunión (completada)" },
      { date: "06-jul", label: "Actividad: Preparar / arreglar PPT (completada)" },
      { date: "08-jul", label: "Actividad: Reunión Presencial Alejandro / MULTI-X (completada)" },
      { date: "08-jul", label: 'Nota: "Reunión Alejandro" — flota actual y modelo operativo' },
    ],
    reason: "Tuviste una reunión hace 21 días donde se habló de posicionar a Southconnect como aliado logístico. No hay correo ni actividad después — vale la pena retomar contacto mientras el tema está fresco.",
    suggestedActionLabel: "Enviar correo de seguimiento",
    actionType: "email",
    emailDraft: {
      from: "kevin.collio@goxt.io",
      to: "alejandro.haro@multi-x.cl",
      subject: "Seguimiento — Reunión Multi-X",
      body: "Estimado Alejandro,\n\nLuego de nuestra reunión donde conversamos sobre el crecimiento de Multi-X y sus desafíos operativos, quisiera coordinar los siguientes pasos. Quedo atento a tu disponibilidad.\n\nSaludos cordiales,",
      signatureName: "Kevin Collio",
      signatureEmail: "kevin.collio@goxt.io",
    },
  },
  {
    id: "novox",
    opportunityName: "Transporte de Oxígeno - Novox",
    organizationName: "Novox",
    contactName: "Mauricio Corbalan",
    stageName: "Propuesta Enviada",
    stageOrder: 5,
    stageTotal: 7,
    signal: "tareas_vencidas",
    priority: "Media",
    daysAgo: 23,
    responsible: "Kevin Collio",
    createdDaysAgo: 45,
    signalDetail: '2 tareas propias sin completar: "Evaluar Estudio de Estabilidad" (venció 08-jun) y "Evaluar estructura tarifaria" (venció 15-jun).',
    timeline: [
      { date: "15-jun", label: "Actividad: Reunión presencial oficina Novox (completada)" },
      { date: "15-jun", label: 'Nota: reunión con Gte. Comercial y Gte. General Novox' },
      { date: "15-jun", label: "Tarea creada: Evaluar estructura tarifaria (pendiente)" },
      { date: "15-jun", label: "Tarea creada: Evaluar Estudio de Estabilidad (pendiente)" },
    ],
    reason: "La propuesta ya está enviada, pero quedaron 2 tareas propias sin completar desde hace 3 semanas. Cierra esas tareas o registra por qué están detenidas antes de seguir esperando respuesta.",
    suggestedActionLabel: "Completar tareas pendientes",
    actionType: "activity_task",
    pendingActivities: [
      { title: "Evaluar Estudio de Estabilidad", dueDate: "08-jun", overdueDays: 52 },
      { title: "Evaluar estructura tarifaria", dueDate: "15-jun", overdueDays: 45 },
    ],
  },
  {
    id: "cumbre",
    opportunityName: "Cumbre Gases - Exploración",
    organizationName: "Cumbre Gases",
    contactName: "Cristobal Mery",
    stageName: "Idea - Prospecto",
    stageOrder: 1,
    stageTotal: 7,
    signal: "sin_movimiento",
    priority: "Media",
    daysAgo: 20,
    responsible: "Kevin Collio",
    createdDaysAgo: 20,
    signalDetail: "Sin notas, actividades ni cotizaciones registradas desde que se creó, hace 20 días.",
    timeline: [],
    reason: "Se creó hace 20 días y no se ha registrado ningún contacto — antes de que se enfríe del todo, vale la pena un primer acercamiento.",
    suggestedActionLabel: "Enviar correo de primer contacto",
    actionType: "email",
    emailDraft: {
      from: "kevin.collio@goxt.io",
      to: "cristobal.mery@cumbregases.cl",
      subject: "Primer contacto — Cumbre Gases",
      body: "Estimado Cristobal,\n\nQueríamos ponernos en contacto para conversar sobre las necesidades de transporte de Cumbre Gases y cómo podemos apoyarlos. ¿Tienes disponibilidad esta semana para una breve llamada?\n\nSaludos cordiales,",
      signatureName: "Kevin Collio",
      signatureEmail: "kevin.collio@goxt.io",
    },
  },
  {
    id: "dana",
    opportunityName: "Dana Mazzetto - Don Adolfo SRL",
    organizationName: "Don Adolfo SRL",
    contactName: "Dana Mazzetto",
    stageName: "Lead",
    stageOrder: 1,
    stageTotal: 4,
    signal: "sin_contacto",
    priority: "Baja",
    daysAgo: 0,
    responsible: "Equipo CamiónGO",
    createdDaysAgo: 0,
    signalDetail: 'Respuesta del formulario web: "Me gustaría registrar la empresa como transportista y trabajar con Ustedes."',
    timeline: [
      { date: "hoy", label: "Formulario de Contacto respondido (auto-registro)" },
    ],
    reason: "Se registró hoy como transportista interesada. Es un lead de producto (auto-registro), no de ventas — un primer contacto de bienvenida ayuda a validar sus datos y avanzarla.",
    suggestedActionLabel: "Enviar correo de bienvenida",
    actionType: "email",
    emailDraft: {
      from: "contacto@camiongo.com",
      to: "",
      subject: "¡Bienvenida a CamiónGO!",
      body: "Hola Dana,\n\nGracias por registrar a Don Adolfo SRL como transportista en CamiónGO. Vimos tu interés en trabajar con nosotros — para avanzar necesitamos validar algunos datos de la empresa. ¿Nos confirmas tu correo de contacto para continuar?\n\nSaludos,",
      signatureName: "Equipo CamiónGO",
      signatureEmail: "contacto@camiongo.com",
    },
  },
  {
    id: "antonio",
    opportunityName: "Antonio Chiza - Antonio Chiza",
    organizationName: "Antonio Chiza",
    contactName: "Antonio Chiza",
    stageName: "Lead",
    stageOrder: 1,
    stageTotal: 4,
    signal: "sin_contacto",
    priority: "Baja",
    daysAgo: 0,
    responsible: "Equipo CamiónGO",
    createdDaysAgo: 0,
    signalDetail: 'Respuesta del formulario web: "Tengo mi camión propio de 3.45 toneladas y busco carga en un lugar confiable." Perfil: Transportista & Busco Carga.',
    timeline: [
      { date: "hoy", label: "Formulario de Contacto respondido (auto-registro)" },
    ],
    reason: "Se registró hoy con camión propio, buscando carga. Es un lead de producto (auto-registro), no de ventas — conviene contactarlo pronto mientras está buscando activamente.",
    suggestedActionLabel: "Enviar correo de bienvenida",
    actionType: "email",
    emailDraft: {
      from: "contacto@camiongo.com",
      to: "",
      subject: "¡Bienvenido a CamiónGO!",
      body: "Hola Antonio,\n\nGracias por registrarte con tu camión propio en CamiónGO. Vimos que estás buscando carga — para conectarte con oportunidades disponibles necesitamos validar tus datos. ¿Nos confirmas tu correo de contacto?\n\nSaludos,",
      signatureName: "Equipo CamiónGO",
      signatureEmail: "contacto@camiongo.com",
    },
  },
  {
    id: "corvalan",
    opportunityName: "Transportes Corvalan Frau",
    organizationName: "Transportes Corvalan Frau",
    contactName: "Patricio Ignacio Diaz Corvalan",
    stageName: "Oportunidad",
    stageOrder: 3,
    stageTotal: 6,
    signal: "tareas_vencidas",
    priority: "Media",
    daysAgo: 33,
    responsible: "Kevin Collio",
    createdDaysAgo: 33,
    signalDetail: 'Tarea "enviar mail semanal" programada para 3 días después de creada — sigue pendiente 33 días después.',
    timeline: [
      { date: "26-jun", label: "Nota: mantener informados de alianzas y mejoras del sistema" },
      { date: "26-jun", label: "Tarea creada: enviar mail semanal (pendiente)" },
    ],
    reason: "Programaste un recordatorio para enviar un mail semanal y nunca se marcó como hecho — 33 días después sigue pendiente.",
    suggestedActionLabel: "Agendar llamada de seguimiento",
    actionType: "calendar_event",
    calendarDraft: {
      title: "Llamada de seguimiento — Transportes Corvalan Frau",
      date: "Jueves, 6 de agosto",
      time: "10:00 – 10:30",
      duration: "30 min",
      attendee: "Patricio Ignacio Diaz Corvalan",
      description: "Retomar contacto — el recordatorio semanal programado el 26-jun quedó pendiente. Revisar alianzas y mejoras del sistema con el cliente.",
    },
  },
  {
    id: "andinos",
    opportunityName: "Transportes Andinos",
    organizationName: "Transportes Andinos S.A.",
    contactName: "Esther Lozano",
    stageName: "Desarrollo / Fidelización",
    stageOrder: 6,
    stageTotal: 6,
    signal: "higiene_datos",
    priority: "Baja",
    daysAgo: 83,
    responsible: "Kevin Collio",
    createdDaysAgo: 83,
    signalDetail: 'Cotización "Cotización - Esther Lozano" con estado Aceptada — la oportunidad está en la última etapa del embudo, pero nunca se marcó como Ganada.',
    timeline: [
      { date: "08-may", label: "Cotización aceptada" },
    ],
    reason: "Esta oportunidad lleva 83 días en la última etapa con una cotización ya aceptada, pero nunca se marcó como Ganada. Es común olvidarlo — solo confírmalo si corresponde.",
    suggestedActionLabel: "Actualizar estado",
    actionType: "status_action",
    statusOptions: { recommendation: "Ganada" },
  },
  {
    id: "aquagen",
    opportunityName: "SPOT TRIDENTE AQUAGEN 01 SEMANA",
    organizationName: "Aquagen",
    stageName: "Cierre",
    stageOrder: 4,
    stageTotal: 4,
    signal: "higiene_datos",
    priority: "Alta",
    daysAgo: 58,
    amount: "$8.720.000 CLP",
    responsible: "Kevin Collio",
    createdDaysAgo: 100,
    signalDetail: "2 cotizaciones con estado Aceptada ($8.400.000 y $320.000) — la oportunidad está en la etapa final del embudo, pero nunca se marcó como Ganada.",
    timeline: [
      { date: "17-abr", label: "Cotización aceptada — $8.400.000" },
      { date: "03-jun", label: "Cotización aceptada — $320.000" },
    ],
    reason: "Ya tienes evidencia comercial suficiente (dos cotizaciones aceptadas, etapa final del embudo) — solo falta el cierre administrativo en el CRM.",
    suggestedActionLabel: "Actualizar estado",
    actionType: "status_action",
    statusOptions: { recommendation: "Ganada" },
  },
  {
    id: "slep",
    opportunityName: "Agentes de atención",
    organizationName: "SLEP Maule Costa",
    stageName: "Negociación / Piloto",
    stageOrder: 4,
    stageTotal: 6,
    signal: "tareas_vencidas",
    priority: "Media",
    daysAgo: 119,
    responsible: "Kevin Collio",
    createdDaysAgo: 150,
    signalDetail: 'Actividad "Demo SLEP" (02-abr) sigue sin completarse. Cotización "Cotización - SLEP" enviada, vencida desde el 20-may.',
    timeline: [
      { date: "10-mar", label: "Cotización enviada" },
      { date: "01-abr", label: "Actividad creada: Demo SLEP (pendiente)" },
    ],
    reason: "La demo nunca quedó registrada como realizada, bloqueando cualquier avance real — y la cotización ya venció sin respuesta.",
    suggestedActionLabel: "Completar actividad pendiente",
    actionType: "activity_task",
    pendingActivities: [
      { title: "Demo SLEP", dueDate: "02-abr", overdueDays: 119 },
    ],
  },
]
