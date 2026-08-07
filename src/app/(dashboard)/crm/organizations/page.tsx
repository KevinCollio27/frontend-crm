import { BuildingIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrganizationsTable } from "@/components/dashboard/organizations/OrganizationsTable";

export default function OrganizationPage() {
  return (
    <>
      <PageHeader icon={BuildingIcon} title="Organización" description="Gestiona tu organización" />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <OrganizationsTable />
      </main>
    </>
  );
}