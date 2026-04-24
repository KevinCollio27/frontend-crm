import { ActivityTimeline } from "@/components/settings/activity/ActivityTimeline"

export default function ActivityPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Historial de actividad</h1>
        <p className="text-sm text-muted-foreground">
          Registro de todas las operaciones realizadas en el workspace
        </p>
      </div>
      <ActivityTimeline />
    </main>
  )
}
