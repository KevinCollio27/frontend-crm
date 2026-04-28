"use client";

import { usePathname } from "next/navigation";
import {
  ZapIcon,
  MoreHorizontalIcon,
  XIcon,
  BoxIcon,
  PlusIcon,
  SearchIcon,
  FileTextIcon,
  ActivityIcon,
  UsersIcon,
  CalendarIcon,
  ChevronRightIcon,
  PaperclipIcon,
  MicIcon,
  SendIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useRef, useState, type ElementType } from "react";
import { useAIAssistant } from "@/context/AIAssistantContext";
import { cn } from "@/lib/utils";

interface ContextConfig {
  label: string;
  suggestions: string[];
}

const CONTEXT_MAP: Record<string, ContextConfig> = {
  "/crm/funnels": {
    label: "Oportunidades",
    suggestions: [
      "¿Cuáles son mis oportunidades con cierre esta semana?",
      "¿Qué etapas tienen menor conversión en mi pipeline?",
      "Muéstrame deals sin actividad reciente",
      "¿Cuál es el valor total de mi pipeline este mes?",
    ],
  },
  "/crm/contacts": {
    label: "Contactos",
    suggestions: [
      "¿Qué nuevos contactos necesitan atención?",
      "¿Con quién debería comunicarme hoy?",
      "¿Qué contactos no tienen oportunidades asociadas?",
      "Muéstrame contactos sin actividad reciente",
    ],
  },
  "/crm/organizations": {
    label: "Organizaciones",
    suggestions: [
      "¿Qué organizaciones tienen más oportunidades abiertas?",
      "¿Qué organizaciones no tienen contactos asignados?",
      "Muéstrame organizaciones sin actividad este mes",
      "¿Cuáles son mis organizaciones con mayor valor?",
    ],
  },
  "/crm/activities": {
    label: "Actividades",
    suggestions: [
      "¿Qué actividades están vencidas hoy?",
      "¿Cuántas actividades tengo pendientes esta semana?",
      "¿Qué contactos tienen más actividades abiertas?",
      "Muéstrame actividades sin respuesta del cliente",
    ],
  },
  "/crm/mail": {
    label: "Correo",
    suggestions: [
      "¿Qué correos requieren respuesta urgente?",
      "Resume los emails sin leer de esta semana",
      "¿Con qué contactos no me he comunicado en 30 días?",
      "Muéstrame hilos de correo sin seguimiento",
    ],
  },
  "/crm/documents": {
    label: "Documentos",
    suggestions: [
      "¿Qué documentos están pendientes de aprobación?",
      "Resume los documentos creados este mes",
      "¿Qué oportunidades no tienen documentos adjuntos?",
      "Muéstrame documentos sin revisión reciente",
    ],
  },
  "/marketing/campaigns": {
    label: "Campañas",
    suggestions: [
      "¿Cuál es el rendimiento de mis campañas activas?",
      "¿Qué campaña tiene mejor tasa de apertura?",
      "Muéstrame campañas con bajo engagement",
      "¿Cuántos leads generó mi última campaña?",
    ],
  },
  "/marketing/blogs": {
    label: "Blogs",
    suggestions: [
      "¿Qué artículos tienen mejor rendimiento?",
      "Resume el contenido publicado este mes",
      "¿Qué temas generan más tráfico?",
      "Muéstrame blogs sin publicar",
    ],
  },
  "/home": {
    label: "Inicio",
    suggestions: [
      "¿Cuáles son mis tareas prioritarias hoy?",
      "Resume mis actividades de la semana",
      "¿Qué oportunidades cierran este mes?",
      "Muéstrame el resumen de mi pipeline",
    ],
  },
};

const DEFAULT_CONTEXT: ContextConfig = {
  label: "General",
  suggestions: [
    "¿Cómo puedo mejorar mi pipeline de ventas?",
    "Resume las actividades recientes del equipo",
    "¿Qué métricas debo revisar hoy?",
    "Ayúdame a priorizar mis tareas",
  ],
};

interface QuickAction {
  label: string;
  bg: string;
  icon: ElementType;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Crear", bg: "bg-[#EAF3DE]", icon: PlusIcon, color: "#3B6D11" },
  { label: "Buscar", bg: "bg-[#E6F1FB]", icon: SearchIcon, color: "#185FA5" },
  { label: "Resumir", bg: "bg-[#FAEEDA]", icon: FileTextIcon, color: "#854F0B" },
  { label: "Analizar", bg: "bg-[#EEEDFE]", icon: ActivityIcon, color: "#534AB7" },
  { label: "Contactos", bg: "bg-[#E1F5EE]", icon: UsersIcon, color: "#0F6E56" },
  { label: "Actividades", bg: "bg-[#FCEBEB]", icon: CalendarIcon, color: "#A32D2D" },
];

export function AIAssistantPanel() {
  const { close } = useAIAssistant();
  const pathname = usePathname();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");

  const contextKey = Object.keys(CONTEXT_MAP).find((key) => pathname.startsWith(key)) ?? "";
  const context = CONTEXT_MAP[contextKey] ?? DEFAULT_CONTEXT;

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSuggestion = (suggestion: string) => {
    setMessage(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-3.5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-[26px] items-center justify-center rounded-full bg-[#EEEDFE]">
            <ZapIcon className="size-3.5 text-[#534AB7]" />
          </div>
          <span className="text-[13px] font-medium">Asistente IA</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="flex size-[26px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <MoreHorizontalIcon className="size-3.5" />
          </button>
          <button
            className="flex size-[26px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            onClick={close}
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">

        {/* Greeting */}
        <div className="flex flex-col items-center gap-2.5 pt-1 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#EEEDFE]">
            <ZapIcon className="size-5 text-[#534AB7]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[15px] font-medium">Hola, Kevin 👋</p>
            <p className="mt-0.5 text-xs text-muted-foreground">¿En qué te puedo ayudar hoy?</p>
          </div>
        </div>

        {/* Context pill */}
        <div className="flex justify-center">
          <button className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-[#AFA9EC]">
            <BoxIcon className="size-2.5" />
            Contexto:&nbsp;<span className="font-medium text-foreground">{context.label}</span>
            <ChevronDownIcon className="size-2.5" />
          </button>
        </div>

        <div className="h-px shrink-0 bg-border" />

        {/* Quick actions */}
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Accesos rápidos
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACTIONS.map(({ label, bg, icon: Icon, color }) => (
              <button
                key={label}
                className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2 text-[12px] font-medium transition-colors hover:border-border hover:bg-background"
              >
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", bg)}>
                  <Icon className="size-3" style={{ color }} />
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px shrink-0 bg-border" />

        {/* Suggestions */}
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Sugerencias
          </p>
          <div className="flex flex-col">
            {context.suggestions.map((suggestion, i) => (
              <button
                key={i}
                className="flex items-start gap-2 border-b border-border/50 px-1.5 py-2 text-left text-[12px] leading-snug transition-colors hover:text-[#534AB7] last:border-0"
                onClick={() => handleSuggestion(suggestion)}
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#AFA9EC]" />
                <span className="flex-1">{suggestion}</span>
                <ChevronRightIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <div className="h-px shrink-0 bg-border" />

        {/* Chat input */}
        <div className="rounded-lg border bg-muted/30 px-3 py-2.5 transition-colors focus-within:border-[#7F77DD]">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onInput={handleInput}
            placeholder="Escribe tu consulta... usa @ para mencionar un registro"
            className="w-full resize-none bg-transparent text-[12px] leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none"
            rows={2}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1.5">
              <button className="flex size-[27px] items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:text-foreground">
                <PaperclipIcon className="size-3" />
              </button>
              <button className="flex size-[27px] items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:text-foreground">
                <MicIcon className="size-3" />
              </button>
            </div>
            <button className="flex size-7 items-center justify-center rounded-full bg-[#534AB7] transition-colors hover:bg-[#3C3489]">
              <SendIcon className="size-3 text-white" />
            </button>
          </div>
        </div>

      </div>

      {/* Disclaimer */}
      <p className="shrink-0 border-t px-4 py-2.5 text-center text-[10px] leading-relaxed text-muted-foreground/60">
        El asistente IA puede cometer errores. Verifica la información importante.
      </p>
    </div>
  );
}
