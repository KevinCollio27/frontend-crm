import { useSessionStore } from "@/store/session.store"

export function useIsWorkspaceAdmin(): boolean {
  const user = useSessionStore((s) => s.user)
  const workspaceId = useSessionStore((s) => s.workspaceId)
  return !!user?.user_workspace?.find((uw) => uw.workspace_id === workspaceId && (uw.is_admin || uw.is_owner))
}
