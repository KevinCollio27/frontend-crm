import { Suspense } from "react"
import { TrendingUpIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { FunnelKanban } from "@/components/dashboard/funnels/FunnelKanban"

export default function FunnelsPage() {
  return (
    <>
      <PageHeader
        icon={TrendingUpIcon}
        title="Funnels"
        description="Gestiona las oportunidades de tu pipeline"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Suspense>
          <FunnelKanban />
        </Suspense>
      </div>
    </>
  )
}
