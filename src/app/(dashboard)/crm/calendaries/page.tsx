import { CalendarHeart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CrmCalendar } from "@/components/dashboard/calendar/CrmCalendar";

export default function CalendarPage() {
  return (
    <>
      <PageHeader icon={CalendarHeart} title="Calendario" description="Gestiona tu calendario" />
      <main className="flex flex-1 flex-col overflow-y-auto p-4">
        <CrmCalendar />
      </main>
    </>
  );
}
