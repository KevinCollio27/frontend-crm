import { ActivityIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ActivityKanban } from "@/components/dashboard/activities/ActivityKanban"

export default function ActivitiesPage() {
  return (
    <>
      <PageHeader icon={ActivityIcon} title="Actividades" description="Gestiona tus actividades" />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ActivityKanban />
      </div>
    </>
  )
}
