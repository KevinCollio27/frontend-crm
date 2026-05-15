import { CloudUpload, UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DocumentsTable } from "@/components/dashboard/documents/DocumentsTable";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader icon={CloudUpload} title="Documentos" description="Gestiona tus documentos" />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        <DocumentsTable />
      </main>
    </>
  );
}
