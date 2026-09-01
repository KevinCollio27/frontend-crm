"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session.store";
import { saveLastWorkspace } from "@/lib/workspace-pref";
import { flowService } from "@/services/flow.service";

// Los correos de bienvenida (crear workspace, invitación) llevan ?workspace_id=
// en el link — sin esto, el navegador se queda con el workspace que ya tenía
// activo en localStorage (ver session.store.ts hydrate()), no con el nuevo.
// Mismo patrón que WelcomeToast: actuar una vez hidratada la sesión y limpiar
// el param de la URL (lee window.location.search directo, no useSearchParams,
// para no necesitar un boundary de Suspense).
export const WorkspaceLinkHandler = () => {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const workspaceId = useSessionStore((s) => s.workspaceId);
  const isLoading = useSessionStore((s) => s.isLoading);
  const handled = useRef(false);

  useEffect(() => {
    if (isLoading || handled.current) return;

    const raw = new URLSearchParams(window.location.search).get("workspace_id");
    if (!raw) return;
    handled.current = true;

    const targetId = parseInt(raw, 10);
    const belongsToUser = user?.user_workspace?.some((w) => w.workspace_id === targetId);

    async function apply() {
      if (belongsToUser && targetId !== workspaceId) {
        await fetch("/api/auth/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: targetId }),
        });
        if (user) saveLastWorkspace(user.id, targetId);
        flowService.invalidateCache();
        useSessionStore.getState().setSession(user!, targetId);
      }

      const url = new URL(window.location.href);
      url.searchParams.delete("workspace_id");
      router.replace(url.pathname + (url.search || ""));
    }

    apply();
  }, [isLoading, user, workspaceId, router]);

  return null;
};
