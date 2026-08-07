import { Suspense } from "react"
import { OrganizationDetail } from "@/components/dashboard/organizations/OrganizationDetail"

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <Suspense>
      <OrganizationDetail id={Number(id)} />
    </Suspense>
  )
}
