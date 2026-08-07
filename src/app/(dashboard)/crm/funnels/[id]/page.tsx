import { Suspense } from "react"
import { OpportunityDetail } from "@/components/dashboard/funnels/OpportunityDetail"

export default async function FunnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <Suspense>
      <OpportunityDetail id={Number(id)} />
    </Suspense>
  )
}
