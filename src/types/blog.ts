export interface BlogRaw {
  id: number
  workspace_id: number
  name: string
  brand_color: string | null
  logo_url: string | null
  allowed_domains: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  _count: { blog_post: number }
}

export interface BlogPage {
  data: BlogRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

// ---- tipos para posts (usados en vistas de detalle de blog) ----

export interface BlogAuthor {
  name: string
}

export interface BlogPostRaw {
  id: number
  blog_id: number
  title: string
  slug: string
  tags: string | null
  thumbnail_url: string | null
  author_id: number | null
  is_published: boolean
  published_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
  author: BlogAuthor | null
}

export interface BlogPostPage {
  data: BlogPostRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}
