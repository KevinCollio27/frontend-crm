import { UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ContactsTable } from "@/components/dashboard/contacts/ContactsTable";

export default function ContactsPage() {
  return (
    <>
      <PageHeader icon={UsersIcon} title="Contactos" description="Gestiona tus contactos" />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <ContactsTable />
      </main>
    </>
  );
}
