import { AiAssistantsPanel } from "@/components/settings/ai-assistants/AiAssistantsPanel"

export default function AiAssistantsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Asistentes de IA</h1>
        <p className="text-sm text-muted-foreground">
          Conecta Claude, ChatGPT o Gemini para que trabajen con tu CRM
        </p>
      </div>
      <AiAssistantsPanel />
    </main>
  )
}
