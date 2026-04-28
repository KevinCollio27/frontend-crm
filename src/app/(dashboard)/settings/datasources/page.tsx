import { SparklesIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function DatasourcesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Datasources</h1>
        <p className="text-sm text-muted-foreground">Sube archivos para que la IA de tu workspace los use como contexto</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
            <SparklesIcon className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Próximamente</span>
          </div>
          <p className="text-xs text-muted-foreground">Estamos trabajando en esto.</p>
        </CardContent>
      </Card>
    </main>
  )
}
