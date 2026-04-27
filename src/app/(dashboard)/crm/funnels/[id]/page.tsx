import { redirect } from "next/navigation"
import { DEAL_DETAILS } from "@/components/dashboard/funnels/data"
import { FunnelDetail } from "@/components/dashboard/funnels/FunnelDetail"

export default async function FunnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = DEAL_DETAILS[id]
  if (!detail) redirect("/crm/funnels")
  return <FunnelDetail deal={detail} />
}
