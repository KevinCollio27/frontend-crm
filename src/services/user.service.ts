import api from "@/lib/api"
import type { User } from "@/types/auth"

export interface UpdateProfilePayload {
  userId: number
  name: string
  email: string
  phone?: string | null
}

export interface UpdatePasswordPayload {
  userId: number
  password_actual: string
  password: string
  confirm: string
}

export const userService = {
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await api.put<never, { updatedUser: User }>("user", payload)
    return res.updatedUser
  },

  async updatePassword(payload: UpdatePasswordPayload): Promise<void> {
    await api.post("user/update-password", payload)
  },

  async uploadAvatar(fileName: string, base64File: string): Promise<string> {
    const res = await api.post<never, { data: { avatar_url: string } }>(
      "user/upload-avatar",
      { fileName, base64File }
    )
    return res.data.avatar_url
  },
}
