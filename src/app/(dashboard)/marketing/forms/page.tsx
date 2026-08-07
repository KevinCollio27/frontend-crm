import { Suspense } from "react";
import { ClipboardListIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FormsView } from "@/components/dashboard/forms/FormsView";

export default function FormsPage() {
  return (
    <>
      <PageHeader icon={ClipboardListIcon} title="Formularios" description="Gestiona tus formularios embebidos" />
      <Suspense>
        <FormsView />
      </Suspense>
    </>
  );
}