export interface UserWorkspace {
  id: number;
  workspace_id: number;
  is_active: boolean;
  is_admin: boolean;
  is_owner: boolean;
  workspace?: {
    id: number;
    name: string;
    logo: string | null;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_email_verified: boolean;
  is_active: boolean;
  user_workspace?: UserWorkspace[];
}

export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  user?: User;
  token?: string;
  resetToken?: string;
  workspace?: { id: number; name: string; logo?: string | null };
  expireAt?: string;
  data?: T;
}
