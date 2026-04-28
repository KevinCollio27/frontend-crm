import { redirect } from "next/navigation"
import { ACTIVITY_DETAILS } from "@/components/dashboard/activities/data"
import { ActivityDetail } from "@/components/dashboard/activities/ActivityDetail"

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = ACTIVITY_DETAILS[id]
  if (!detail) redirect("/crm/activities")
  return <ActivityDetail activity={detail} />
}
