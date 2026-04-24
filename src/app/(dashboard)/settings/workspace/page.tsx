import { WorkspaceForm } from "@/components/settings/workspace/WorkspaceForm"

export default function WorkspacePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Workspace</h1>
        <p className="text-sm text-muted-foreground">Configura los datos generales de tu workspace</p>
      </div>
      <WorkspaceForm />
    </main>
  )
}
