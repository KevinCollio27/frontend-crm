import { useSessionStore } from "@/store/session.store"

// Antes de que `hydrate()` corra en el cliente, `user` ya viene precargado
// desde localStorage (para que el sidebar no parpadee) pero el servidor no
// tiene ese dato — devolver `true` en ese instante hacía que el primer render
// del cliente no coincidiera con el del servidor para cualquier UI que
// aparece/desaparece según esto (ej. el botón "+ Crear" solo para admins),
// causando errores de hidratación. `hasHydrated` fuerza `false` hasta que el
// cliente confirmó la sesión, igual que el servidor.
export function useIsWorkspaceAdmin(): boolean {
  const user = useSessionStore((s) => s.user)
  const workspaceId = useSessionStore((s) => s.workspaceId)
  const hasHydrated = useSessionStore((s) => s.hasHydrated)
  if (!hasHydrated) return false
  return !!user?.user_workspace?.find((uw) => uw.workspace_id === workspaceId && (uw.is_admin || uw.is_owner))
}
