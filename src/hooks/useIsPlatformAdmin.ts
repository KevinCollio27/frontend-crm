import { useSessionStore } from "@/store/session.store"

// Mismo criterio que useIsWorkspaceAdmin: `isPlatformAdmin` viene precargado desde
// localStorage antes de que `hydrate()` confirme la sesión con el servidor — devolver ese
// valor cacheado en ese instante rompe la hidratación para cualquier UI que aparece/
// desaparece según esto (ej. la tab "Referencias" del Dashboard, solo para el admin de
// plataforma). `hasHydrated` fuerza `false` hasta que el cliente confirmó la sesión.
export function useIsPlatformAdmin(): boolean {
  const isPlatformAdmin = useSessionStore((s) => s.isPlatformAdmin)
  const hasHydrated = useSessionStore((s) => s.hasHydrated)
  if (!hasHydrated) return false
  return isPlatformAdmin
}
