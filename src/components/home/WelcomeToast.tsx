"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useSessionStore } from "@/store/session.store";

export const WelcomeToast = () => {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const isLoading = useSessionStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;
    if (!window.location.search.includes("welcome=google")) return;

    const firstName = user?.name?.split(" ")[0] ?? "";
    notify.success({
      title: `¡Bienvenido, ${firstName}!`,
      description: "Comienza a gestionar tus ventas.",
    });

    // Limpiar el param de la URL sin recargar
    const url = new URL(window.location.href);
    url.searchParams.delete("welcome");
    router.replace(url.pathname + (url.search || ""));
  }, [isLoading, user, router]);

  return null;
};
