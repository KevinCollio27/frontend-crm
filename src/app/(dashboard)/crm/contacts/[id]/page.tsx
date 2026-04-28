import { redirect } from "next/navigation"
import { CONTACT_DETAILS } from "@/components/dashboard/contacts/data"
import { ContactDetail } from "@/components/dashboard/contacts/ContactDetail"

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = CONTACT_DETAILS[id]
  if (!detail) redirect("/crm/contacts")
  return <ContactDetail contact={detail} />
}
