import api from "@/lib/api"
import type { BlogPage, BlogPostDetailRaw, BlogPostRaw, BlogRaw } from "@/types/blog"

export interface BlogListParams {
  page?: number
  take?: number
  filter?: string
  is_active?: boolean
}

export interface BlogPostListParams {
  page?: number
  take?: number
  filter?: string
  is_published?: boolean
}

export interface BlogCreatePayload {
  name: string
  brand_color?: string
  logo_url?: string
  allowed_domains?: string
}

export interface BlogUpdatePayload {
  name?: string
  brand_color?: string
  is_active?: boolean
  logo_url?: string
  allowed_domains?: string
}

export interface BlogPostCreatePayload {
  title: string
  content: string
  thumbnail_url?: string | null
  tags?: string | null
  is_published?: boolean
  author_id?: number | null
}

export interface BlogPostUpdatePayload {
  title?: string
  content?: string
  thumbnail_url?: string | null
  tags?: string | null
  is_published?: boolean
  published_at?: string | null
  author_id?: number | null
}

export const blogService = {
  // ── Blogs ──────────────────────────────────────────────────────────────────

  async list(params: BlogListParams = {}): Promise<BlogPage> {
    const res = await api.get<never, { data: BlogPage }>("blog", { params })
    return res.data
  },

  async getById(id: number): Promise<BlogRaw> {
    const res = await api.get<never, { data: BlogRaw }>(`blog/${id}`)
    return res.data
  },

  async create(payload: BlogCreatePayload): Promise<BlogRaw> {
    const res = await api.post<never, { data: BlogRaw }>("blog", payload)
    return res.data
  },

  async update(id: number, payload: BlogUpdatePayload): Promise<BlogRaw> {
    const res = await api.patch<never, { data: BlogRaw }>(`blog/${id}`, payload)
    return res.data
  },

  async deactivate(id: number): Promise<void> {
    await api.delete(`blog/${id}`)
  },

  // ── Posts ──────────────────────────────────────────────────────────────────

  async listPosts(blogId: number, params: BlogPostListParams = {}): Promise<BlogPostRaw[]> {
    const res = await api.get<never, { data: BlogPostRaw[] }>(`blog/${blogId}/posts`, { params })
    return res.data
  },

  async getPost(blogId: number, postId: number): Promise<BlogPostDetailRaw> {
    const res = await api.get<never, { data: BlogPostDetailRaw }>(`blog/${blogId}/posts/${postId}`)
    return res.data
  },

  async createPost(blogId: number, payload: BlogPostCreatePayload): Promise<BlogPostRaw> {
    const res = await api.post<never, { data: BlogPostRaw }>(`blog/${blogId}/posts`, payload)
    return res.data
  },

  async updatePost(blogId: number, postId: number, payload: BlogPostUpdatePayload): Promise<BlogPostRaw> {
    const res = await api.patch<never, { data: BlogPostRaw }>(`blog/${blogId}/posts/${postId}`, payload)
    return res.data
  },

  async deletePost(blogId: number, postId: number): Promise<void> {
    await api.delete(`blog/${blogId}/posts/${postId}`)
  },

  async reorderPosts(blogId: number, orderedIds: number[]): Promise<void> {
    await api.patch(`blog/${blogId}/posts/reorder`, { orderedIds })
  },

  async uploadThumbnail(blogId: number, fileName: string, base64File: string): Promise<string> {
    const res = await api.post<never, { data: { thumbnail_url: string } }>(
      `blog/${blogId}/posts/upload-thumbnail`,
      { fileName, base64File }
    )
    return res.data.thumbnail_url
  },
}
