"use client";

import * as React from "react";
import { CalendarHeart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CrmCalendar } from "@/components/dashboard/calendar/CrmCalendar";
import { useSidebar } from "@/components/ui/sidebar";

export default function CalendarPage() {
  const { setOpen } = useSidebar();

  React.useEffect(() => {
    setOpen(false);
    return () => setOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader icon={CalendarHeart} title="Calendario" description="Gestiona tu calendario" />
      <main className="flex flex-1 flex-col overflow-y-auto p-4">
        <CrmCalendar />
      </main>
    </>
  );
}
