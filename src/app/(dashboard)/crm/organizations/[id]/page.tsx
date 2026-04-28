import { redirect } from "next/navigation"
import { ORGANIZATION_DETAILS } from "@/components/dashboard/organizations/data"
import { OrganizationDetail } from "@/components/dashboard/organizations/OrganizationDetail"

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = ORGANIZATION_DETAILS[id]
  if (!detail) redirect("/crm/organizations")
  return <OrganizationDetail organization={detail} />
}
