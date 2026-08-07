import api from "@/lib/api";
import { useSessionStore } from "@/store/session.store";
import { getLastWorkspace, saveLastWorkspace } from "@/lib/workspace-pref";
import type { ApiResponse, User } from "@/types/auth";

export const authService = {
  async login(email: string, password: string, rememberMe = false): Promise<ApiResponse> {
    const data = await api.post<never, ApiResponse>("auth/login", { email, password, rememberMe });
    if (data.success && data.user) {
      const workspaces = data.user.user_workspace ?? [];
      let workspaceId: number | null = workspaces[0]?.workspace_id ?? null;

      if (workspaces.length > 1) {
        const lastUsed = getLastWorkspace(data.user.id);
        const isValid = lastUsed != null && workspaces.some(w => w.workspace_id === lastUsed);
        if (isValid && lastUsed !== workspaceId) {
          workspaceId = lastUsed;
          await fetch("/api/auth/session", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId }),
          });
        }
      }

      if (workspaceId) saveLastWorkspace(data.user.id, workspaceId);
      useSessionStore.getState().setSession(data.user, workspaceId);
    }
    return data;
  },

  async register(name: string, email: string, password: string, phone?: string, workspaceId?: number): Promise<ApiResponse> {
    return api.post("auth/register", { name, email, password, phone, ...(workspaceId ? { workspaceId } : {}) });
  },

  async acceptInviteUserToWorkspace(token: string, email: string): Promise<ApiResponse> {
    const data = await api.post<never, ApiResponse>("auth/accept-invite-user-to-workspace", { token, email });
    if (data.success && data.user && data.workspace) {
      // El user de esta respuesta se busca antes de crear el user_workspace, así que
      // llega incompleto (sin el workspace nuevo en user_workspace) — hidratamos desde
      // /auth/me para tener los datos completos sin necesidad de recargar la página.
      useSessionStore.getState().setSession(data.user, data.workspace.id);
      await useSessionStore.getState().hydrate();
    }
    return data;
  },

  async getInviteLinkInfo(code: string): Promise<ApiResponse> {
    return api.get(`auth/invite-link/${code}`);
  },

  async acceptInviteLink(code: string, name: string, email: string, password: string): Promise<ApiResponse> {
    const data = await api.post<never, ApiResponse>("auth/accept-invite-link", { code, name, email, password });
    if (data.success && data.user && data.workspace) {
      useSessionStore.getState().setSession(data.user, data.workspace.id);
      await useSessionStore.getState().hydrate();
    }
    return data;
  },

  async joinByInviteLink(code: string): Promise<ApiResponse> {
    const data = await api.post<never, ApiResponse>("auth/join-by-invite-link", { code });
    if (data.success && data.workspace) {
      const current = useSessionStore.getState();
      if (current.user) useSessionStore.getState().setSession(current.user, data.workspace.id);
      await useSessionStore.getState().hydrate();
    }
    return data;
  },

  async verifyEmail(email: string, code: string): Promise<ApiResponse> {
    const data = await api.post<never, ApiResponse>("auth/verify-email", { email, code });
    if (data.success && data.user) {
      useSessionStore.getState().setSession(data.user, null);
    }
    return data;
  },

  async resendVerificationEmail(email: string): Promise<ApiResponse> {
    return api.post("auth/resend-verification-email", { email });
  },

  async recoveryPassword(email: string): Promise<ApiResponse> {
    return api.post("auth/recovery-password", { email });
  },

  async verifyRecoveryPassword(email: string, code: string): Promise<ApiResponse> {
    return api.post("auth/verify-recovery-password", { email, code });
  },

  async resetPassword(token: string, password: string, confirm: string): Promise<ApiResponse> {
    return api.post("auth/reset-password", { token, password, confirm });
  },

  async createWorkspace(params: {
    name: string;
    country: { id: string; name: string };
    timezone: { id: string; name: string };
    currency: { id: number; name: string };
  }): Promise<ApiResponse> {
    const data = await api.post<never, ApiResponse>("workspace", params);
    if (data.success && data.workspace?.id) {
      await fetch("/api/auth/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: data.workspace.id }),
      });
      const current = useSessionStore.getState();
      if (current.user) {
        useSessionStore.getState().setSession(current.user, data.workspace.id);
      }
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.get("auth/logout");
    } finally {
      await useSessionStore.getState().clear();
      if (typeof window !== "undefined") window.location.replace("/login");
    }
  },
} satisfies Record<string, (...args: never[]) => Promise<unknown>>;
