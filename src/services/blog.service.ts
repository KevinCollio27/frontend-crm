import api from "@/lib/api"
import type { BlogPage } from "@/types/blog"

export interface BlogListParams {
  page?: number
  take?: number
  filter?: string
  is_active?: boolean
}

export const blogService = {
  async list(params: BlogListParams = {}): Promise<BlogPage> {
    const res = await api.get<never, { data: BlogPage }>("blog", { params })
    return res.data
  },
}
