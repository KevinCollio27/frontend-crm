import { create } from "zustand";
import type { User } from "@/types/auth";

const SESSION_CACHE_KEY = "crm_session";

interface PlatformAdminViewing {
  id: number;
  name: string;
}

interface CachedSession {
  user: User;
  workspaceId: number | null;
  platformAdminViewing?: PlatformAdminViewing | null;
  isPlatformAdmin?: boolean;
}

function readCache(): CachedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedSession) : null;
  } catch {
    return null;
  }
}

function writeCache(user: User, workspaceId: number | null, platformAdminViewing?: PlatformAdminViewing | null, isPlatformAdmin?: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user, workspaceId, platformAdminViewing: platformAdminViewing ?? null, isPlatformAdmin: isPlatformAdmin ?? false }));
  } catch {}
}

function clearCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
  } catch {}
}

interface SessionState {
  user: User | null;
  workspaceId: number | null;
  // No-null cuando un admin de plataforma entró a un workspace ajeno (sin
  // membresía real) — solo lleva el nombre para el banner, nada sensible.
  platformAdminViewing: PlatformAdminViewing | null;
  // Si el usuario logueado es admin de plataforma (PLATFORM_ADMIN_EMAILS) —
  // habilita la sección "Todos los workspaces" en el TeamSwitcher.
  isPlatformAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (user: User, workspaceId: number | null) => void;
  enterAsPlatformAdmin: (workspace: PlatformAdminViewing) => void;
  exitPlatformAdminView: () => void;
  clear: () => Promise<void>;
  hydrate: () => Promise<void>;
}

// Pre-populate from cache so the sidebar renders immediately on the first client frame.
// readCache() returns null on the server (typeof window === "undefined"), so no SSR mismatch.
const _initial = readCache();

export const useSessionStore = create<SessionState>((set, get) => ({
  user: _initial?.user ?? null,
  workspaceId: _initial?.workspaceId ?? null,
  platformAdminViewing: _initial?.platformAdminViewing ?? null,
  isPlatformAdmin: _initial?.isPlatformAdmin ?? false,
  isAuthenticated: !!_initial?.user,
  isLoading: true, // still validate with server even if cache hit

  // Representa "esta es tu sesión real" — por eso siempre limpia
  // platformAdminViewing (si venías viendo un workspace ajeno, este llamado
  // significa que volviste a un workspace propio de verdad).
  setSession: (user, workspaceId) => {
    const { isPlatformAdmin } = get();
    writeCache(user, workspaceId, null, isPlatformAdmin);
    set({ user, workspaceId, platformAdminViewing: null, isAuthenticated: true, isLoading: false });
  },

  // El PATCH a /api/auth/session ya lo hace quien llama (el TeamSwitcher) —
  // esto solo actualiza el estado local para que el banner y las siguientes
  // requests (workspace-id via cookie) queden consistentes.
  enterAsPlatformAdmin: (workspace) => {
    const { user, isPlatformAdmin } = get();
    if (!user) return;
    writeCache(user, workspace.id, workspace, isPlatformAdmin);
    set({ workspaceId: workspace.id, platformAdminViewing: workspace });
  },

  exitPlatformAdminView: () => {
    const { user, isPlatformAdmin } = get();
    const homeWorkspaceId = user?.user_workspace?.[0]?.workspace_id ?? null;
    if (user) writeCache(user, homeWorkspaceId, null, isPlatformAdmin);
    set({ workspaceId: homeWorkspaceId, platformAdminViewing: null });
    fetch("/api/auth/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: homeWorkspaceId }),
    }).catch(() => {});
  },

  clear: async () => {
    clearCache();
    set({ user: null, workspaceId: null, platformAdminViewing: null, isPlatformAdmin: false, isAuthenticated: false, isLoading: false });
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
  },

  hydrate: async () => {
    // Validate session with server (initial state already pre-populated from cache)
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        const freshWorkspaceId = data.workspaceId ?? data.user.user_workspace?.[0]?.workspace_id ?? null;
        const isPlatformAdmin = !!data.isPlatformAdmin;
        set((prev) => {
          const workspaceId = prev.workspaceId ?? freshWorkspaceId;
          // Si estamos "viendo como admin" un workspace que no es el propio,
          // no lo pisamos con el de user_workspace[0].
          const stillPlatformAdmin = prev.platformAdminViewing?.id === workspaceId ? prev.platformAdminViewing : null;
          writeCache(data.user, workspaceId, stillPlatformAdmin, isPlatformAdmin);
          return { user: data.user, workspaceId, platformAdminViewing: stillPlatformAdmin, isPlatformAdmin, isAuthenticated: true, isLoading: false };
        });
      } else {
        clearCache();
        set({ user: null, workspaceId: null, platformAdminViewing: null, isPlatformAdmin: false, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
