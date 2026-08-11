import { Suspense } from "react";
import CreateWorkspace from "@/components/onboarding/CreateWorkspace";

export default function CreateWorkspacePage() {
  return (
    <Suspense>
      <CreateWorkspace />
    </Suspense>
  );
}
