import { create } from "zustand";
import type { User } from "@/types/auth";

interface SessionState {
  user: User | null;
  workspaceId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (user: User, workspaceId: number | null) => void;
  clear: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  workspaceId: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (user, workspaceId) => {
    set({ user, workspaceId, isAuthenticated: true, isLoading: false });
  },

  clear: async () => {
    set({ user: null, workspaceId: null, isAuthenticated: false, isLoading: false });
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
  },

  hydrate: async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        const workspaceId = data.workspaceId ?? data.user.user_workspace?.[0]?.workspace_id ?? null;
        set({ user: data.user, workspaceId, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
