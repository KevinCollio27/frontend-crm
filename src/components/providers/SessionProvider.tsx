"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/session.store";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
