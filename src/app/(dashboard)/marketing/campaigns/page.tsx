import { SendIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CampaignsTable } from "@/components/dashboard/campains/CampaignsTable";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader icon={SendIcon} title="Campañas" description="Gestiona tus campañas de email" />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <CampaignsTable />
      </main>
    </>
  );
}