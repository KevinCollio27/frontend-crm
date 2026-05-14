const key = (userId: number) => `ws_pref_${userId}`;

export function getLastWorkspace(userId: number): number | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(key(userId));
  return v ? parseInt(v, 10) : null;
}

export function saveLastWorkspace(userId: number, workspaceId: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(userId), String(workspaceId));
}
