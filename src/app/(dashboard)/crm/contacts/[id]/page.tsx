import { Suspense } from "react"
import { ContactDetail } from "@/components/dashboard/contacts/ContactDetail"

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <Suspense>
      <ContactDetail id={Number(id)} />
    </Suspense>
  )
}
