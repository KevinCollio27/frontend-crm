import { BotIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { WidgetsTable } from "@/components/dashboard/widget-ai/WidgetsTable";

export default function WidgetAIPage() {
  return (
    <>
      <PageHeader icon={BotIcon} title="Widgets IA" description="Gestiona tus agentes de chat embebibles" />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        <WidgetsTable />
      </main>
    </>
  );
}
