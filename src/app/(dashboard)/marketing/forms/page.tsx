import { ClipboardListIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FormsTable } from "@/components/dashboard/forms/FormsTable";

export default function FormsPage() {
  return (
    <>
      <PageHeader icon={ClipboardListIcon} title="Formularios" description="Gestiona tus formularios embebidos" />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        <FormsTable />
      </main>
    </>
  );
}