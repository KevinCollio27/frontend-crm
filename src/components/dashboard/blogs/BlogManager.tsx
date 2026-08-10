"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Code2Icon,
  CopyIcon,
  GripVerticalIcon,
  ImageIcon,
  LinkIcon,
  Loader2Icon,
  MessageCircleIcon,
  MonitorIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SmartphoneIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import { confirmDialog } from "@/lib/confirm"
import { blogService } from "@/services/blog.service"
import type { BlogPostDetailRaw, BlogPostRaw, BlogRaw } from "@/types/blog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { CreateBlogSheet, blogRawToFormValues, VIEWS, type BlogView } from "./CreateBlogSheet"
import { CreatePostSheet, type PostFormValues } from "./CreatePostSheet"
import { LinkedInIcon, XSocialIcon } from "../campains/shared/social-icons"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseColor(raw: string | null): string {
  if (!raw) return "#6D4AFF"
  return raw.split(";")[0] || "#6D4AFF"
}

function parseView(raw: string | null): BlogView {
  const part = raw?.split(";").find((p) => p.startsWith("layout:"))
  const value = part?.split(":")[1] as BlogView | undefined
  return value && VIEWS.some((v) => v.value === value) ? value : "grid"
}

function postToFormValues(post: BlogPostDetailRaw): PostFormValues {
  return {
    title: post.title,
    slug: post.slug,
    thumbnailUrl: post.thumbnail_url ?? "",
    tags: post.tags ? post.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    content: post.content,
    status: post.is_published ? "published" : "draft",
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <>
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex items-center gap-2">
          <div className="size-7 animate-pulse rounded bg-muted" />
          <div className="h-4 w-px bg-border" />
          <div className="size-7 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-10 animate-pulse rounded bg-muted" />
            <div className="size-3 rounded bg-muted/40" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex w-105 shrink-0 flex-col border-r">
          <div className="space-y-3 p-4">
            <div className="flex gap-2">
              <div className="h-8 flex-1 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 flex-1 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
          <div className="flex-1 space-y-2 px-4 pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                <div className="mt-1 size-3.5 animate-pulse rounded bg-muted/50" />
                <div className="size-12 shrink-0 animate-pulse rounded-md bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden bg-muted/10 p-6">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
            <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
            <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="flex flex-1 justify-center overflow-hidden">
            <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-black/80">
              <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-white/10 px-4">
                <div className="size-2.5 rounded-full bg-white/10" />
                <div className="size-2.5 rounded-full bg-white/10" />
                <div className="size-2.5 rounded-full bg-white/10" />
                <div className="mx-auto h-5 w-48 animate-pulse rounded bg-white/10" />
              </div>
              <div className="flex-1 p-8">
                <div className="mb-6 h-6 w-40 animate-pulse rounded bg-white/10" />
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="aspect-video w-full animate-pulse rounded-lg bg-white/10" />
                      <div className="h-3 w-14 animate-pulse rounded-full bg-white/10" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlogManager({ id }: { id: number }) {
  const router = useRouter()
  const { setOpen } = useSidebar()

  React.useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [blog, setBlog] = React.useState<BlogRaw | null>(null)
  const [posts, setPosts] = React.useState<BlogPostRaw[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<boolean | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [installOpen, setInstallOpen] = React.useState(false)
  const [postSheetOpen, setPostSheetOpen] = React.useState(false)
  const [postSheetLoading, setPostSheetLoading] = React.useState(false)
  const [editingPost, setEditingPost] = React.useState<PostFormValues | undefined>(undefined)
  const [editingPostId, setEditingPostId] = React.useState<number | undefined>(undefined)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      Promise.all([
        blogService.getById(id),
        blogService.listPosts(id, {
          filter: search || undefined,
          is_published: statusFilter ?? undefined,
          take: 100,
        }),
      ])
        .then(([blogRes, postsRes]) => {
          if (cancelled) return
          setBlog(blogRes)
          setPosts(postsRes)
          setLoading(false)
        })
        .catch(() => {
          // Mismo patrón que OrganizationDetail: si el fetch falla (ej. el blog ya no
          // pertenece al workspace activo porque el usuario lo cambió mientras estaba
          // acá adentro), sacarlo a la lista en vez de dejarlo viendo un detalle fantasma.
          if (!cancelled) router.push("/marketing/blogs")
        })
    }, search ? 400 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [id, search, statusFilter])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setPosts((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id)
      const newIndex = prev.findIndex((p) => p.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      const reordered = arrayMove(prev, oldIndex, newIndex)
      blogService.reorderPosts(id, reordered.map((p) => p.id)).catch(() => {
        notify.error({ title: "No se pudo guardar el orden", description: "Intenta de nuevo." })
      })
      return reordered
    })
  }

  function handleNewPost() {
    setEditingPost(undefined)
    setEditingPostId(undefined)
    setPostSheetOpen(true)
  }

  function handleEditPost(post: BlogPostRaw) {
    if (!blog) return
    setPostSheetOpen(true)
    setPostSheetLoading(true)
    blogService
      .getPost(blog.id, post.id)
      .then((detail) => {
        setEditingPost(postToFormValues(detail))
        setEditingPostId(post.id)
        setPostSheetLoading(false)
      })
      .catch(() => {
        notify.error({ title: "No se pudo cargar el post", description: "Intenta de nuevo." })
        setPostSheetOpen(false)
        setPostSheetLoading(false)
      })
  }

  async function handleDuplicatePost(post: BlogPostRaw) {
    if (!blog) return
    const toastId = notify.info({ title: "Duplicando post...", description: `Copiando "${post.title}".` })
    try {
      const detail = await blogService.getPost(blog.id, post.id)
      const created = await blogService.createPost(blog.id, {
        title: `${detail.title} (copia)`,
        content: detail.content,
        thumbnail_url: detail.thumbnail_url,
        tags: detail.tags,
        is_published: false,
        author_id: detail.author_id,
      })
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p.id === post.id)
        const next = [...prev]
        next.splice(idx + 1, 0, created)
        return next
      })
      notify.dismiss(toastId)
      notify.success({ title: "Post duplicado", description: `"${created.title}" se creó correctamente.` })
    } catch {
      notify.dismiss(toastId)
      notify.error({ title: "No se pudo duplicar el post", description: "Intenta de nuevo." })
    }
  }

  async function handleDeletePost(post: BlogPostRaw) {
    if (!blog) return
    const ok = await confirmDialog({
      title: "¿Eliminar post?",
      description: `"${post.title}" se eliminará permanentemente.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!ok) return
    setPosts((prev) => prev.filter((p) => p.id !== post.id))
    try {
      await blogService.deletePost(blog.id, post.id)
      notify.success({ title: "Post eliminado", description: `"${post.title}" fue eliminado correctamente.` })
    } catch {
      notify.error({ title: "No se pudo eliminar el post", description: "Intenta de nuevo." })
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p.id === post.id)
        if (idx >= 0) return prev
        return [...prev, post].sort((a, b) => a.id - b.id)
      })
    }
  }

  if (loading || !blog) return <LoadingSkeleton />

  return (
    <>
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="shrink-0" />
          <Separator orientation="vertical" className="shrink-0 data-vertical:h-4 data-vertical:self-auto" />
          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => router.back()}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="flex min-w-0 items-center gap-1 text-sm">
            <Link
              href="/marketing/blogs"
              className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Blogs
            </Link>
            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-medium">{blog.name}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" />}>
            Acciones <ChevronDownIcon className="ml-1 size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <PencilIcon /> Editar Blog
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left — posts */}
        <div className="flex w-105 shrink-0 flex-col border-r">
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Button size="sm" className="flex-1" onClick={handleNewPost}>
                <PlusIcon className="size-4" /> Nuevo Post
              </Button>
              <Button variant="outline" size="sm" onClick={() => setInstallOpen(true)}>
                <Code2Icon className="size-4" /> Instalación
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-8 pl-8 text-sm"
                  placeholder="Buscar posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" />}>
                  {statusFilter === true ? "Publicado" : statusFilter === false ? "Borrador" : "Todos"}
                  <ChevronDownIcon className="ml-1 size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>Todos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter(true)}>Publicado</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter(false)}>Borrador</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {posts.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sin artículos.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={posts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {posts.map((post) => (
                      <SortablePostRow
                        key={post.id}
                        post={post}
                        onEdit={() => handleEditPost(post)}
                        onDuplicate={() => handleDuplicatePost(post)}
                        onDelete={() => handleDeletePost(post)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right — vista previa en vivo */}
        <LivePreview blog={blog} posts={posts} />
      </div>

      <InstallSheet open={installOpen} onOpenChange={setInstallOpen} blog={blog} />
      <CreateBlogSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        blog={blogRawToFormValues(blog)}
        blogId={blog.id}
        onSuccess={(updated) => setBlog(updated)}
      />
      <CreatePostSheet
        open={postSheetOpen}
        onOpenChange={(v) => {
          setPostSheetOpen(v)
          if (!v) { setEditingPost(undefined); setEditingPostId(undefined) }
        }}
        blogId={id}
        post={editingPost}
        postId={editingPostId}
        loading={postSheetLoading}
        onSuccess={() => {
          blogService.listPosts(id, { take: 100 }).then(setPosts).catch(() => {})
        }}
      />
    </>
  )
}

// ─── Install sheet ────────────────────────────────────────────────────────────

function InstallSheet({
  open,
  onOpenChange,
  blog,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  blog: BlogRaw
}) {
  const [copied, setCopied] = React.useState(false)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? ""
  const embedCode = `<!-- GOxT Blog Widget -->\n<script src="${apiBaseUrl}/api/blog-widget/${blog.api_key}/embed.js" async></script>\n<div id="goxt-blog-container"></div>`

  function handleCopy() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    notify.success({ title: "Código copiado al portapapeles", description: "Pégalo en tu sitio web para embeber el blog." })
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: 500, padding: 0, gap: 0 }}
        className="w-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b p-5">
          <div className="space-y-0.5">
            <SheetTitle>Instalación del Widget</SheetTitle>
            <SheetDescription>Pega este snippet en tu sitio web</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">API Key:</span>
            <code className="flex-1 truncate font-mono font-medium">{blog.api_key}</code>
          </div>

          <div className="relative">
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-[12px] leading-relaxed text-zinc-100">
              <code>{embedCode}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-2.5 top-2.5 h-7 gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied
                ? <><CheckIcon className="size-3" /> Copiado</>
                : <><CopyIcon className="size-3" /> Copiar</>
              }
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            El contenedor <code className="rounded bg-muted px-1 font-mono">div#goxt-blog-container</code> es donde
            se inyectarán los artículos. Funciona en WordPress, Shopify o HTML puro.
          </p>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">API REST (headless)</p>

            <div className="space-y-1.5">
              <p className="text-xs font-medium">Listar posts</p>
              <code className="block truncate rounded border bg-background px-2.5 py-1.5 text-[11px] font-mono text-primary">
                GET {apiBaseUrl}/api/blog-widget/{blog.api_key}/posts
              </code>
              <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-100">
{`{
  "success": true,
  "data": {
    "blog": { "id": 12, "name": "...", "brand_color": "#6D4AFF", "layout": "grid", "logo_url": null },
    "posts": [
      { "id": 34, "title": "...", "slug": "...", "content": "<p>...</p>",
        "thumbnail_url": "https://...", "tags": "logística,flota",
        "published_at": "2026-07-20T15:00:00.000Z", "author": { "name": "..." } }
    ]
  }
}`}
              </pre>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium">Post por slug</p>
              <code className="block truncate rounded border bg-background px-2.5 py-1.5 text-[11px] font-mono text-primary">
                GET {apiBaseUrl}/api/blog-widget/{blog.api_key}/posts/:slug
              </code>
              <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-100">
{`{
  "success": true,
  "data": { "id": 34, "title": "...", "slug": "...", "content": "<p>...</p>",
    "thumbnail_url": "https://...", "tags": "logística,flota",
    "published_at": "2026-07-20T15:00:00.000Z", "author": { "name": "..." } }
}`}
              </pre>
              <p className="text-[11px] text-muted-foreground">
                Ojo: acá el post va directo en <code className="rounded bg-muted px-1">data</code>, sin el wrapper
                <code className="rounded bg-muted px-1">blog</code>/<code className="rounded bg-muted px-1">posts</code> del listado.
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground">
              <code className="rounded bg-muted px-1">thumbnail_url</code> es una URL pública estable (no expira) — se puede cachear o usar con ISR sin problema.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-5">
          <SheetClose render={<Button variant="outline" className="w-full" />}>
            Cerrar
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Post row ─────────────────────────────────────────────────────────────────

interface SortablePostRowProps {
  post: BlogPostRaw
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function SortablePostRow({ post, onEdit, onDuplicate, onDelete }: SortablePostRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
  })
  const date = post.published_at ?? post.created_at

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group flex items-start gap-2 rounded-lg border p-3 transition-colors hover:border-foreground/30"
    >
      <button
        type="button"
        className="mt-1 shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Reordenar"
      >
        <GripVerticalIcon className="size-3.5" />
      </button>

      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.thumbnail_url} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-4 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
            post.is_published
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          )}
        >
          {post.is_published ? "Publicado" : "Borrador"}
        </span>
        <p className="truncate text-sm font-medium">{post.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Editar">
          <PencilIcon className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onDuplicate} aria-label="Duplicar">
          <CopyIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="Eliminar"
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Live preview ─────────────────────────────────────────────────────────────

function getCategory(post: BlogPostRaw): string | null {
  const first = post.tags?.split(",")[0]?.trim()
  return first || null
}

function getTagList(post: BlogPostRaw): string[] {
  return post.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? []
}

function LivePreview({ blog, posts }: { blog: BlogRaw; posts: BlogPostRaw[] }) {
  const [view, setView] = React.useState<BlogView>(() => parseView(blog.brand_color))
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop")
  const [activePost, setActivePost] = React.useState<BlogPostDetailRaw | null>(null)
  const [loadingPost, setLoadingPost] = React.useState(false)
  const published = posts.filter((p) => p.is_published)

  function handleOpenPost(post: BlogPostRaw) {
    setLoadingPost(true)
    blogService
      .getPost(blog.id, post.id)
      .then((detail) => setActivePost(detail))
      .catch(() => notify.error({ title: "No se pudo cargar el contenido del post", description: "Intenta de nuevo." }))
      .finally(() => setLoadingPost(false))
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden bg-muted/10 p-6">
      {/* Toolbar */}
      <div className="mx-auto flex w-full max-w-4xl shrink-0 items-center justify-between">
        <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
          {VIEWS.map((v) => {
            const Icon = v.icon
            const active = view === v.value
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => setView(v.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {v.label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              device === "desktop" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MonitorIcon className="size-3.5" /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              device === "mobile" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <SmartphoneIcon className="size-3.5" /> Mobile
          </button>
        </div>
      </div>

      {/* Browser frame */}
      <div className="flex flex-1 justify-center overflow-hidden">
        <div
          className={cn(
            "flex w-full flex-col overflow-hidden rounded-xl border bg-black shadow-sm transition-all",
            device === "mobile" ? "max-w-95" : "max-w-4xl"
          )}
        >
          {/* Browser chrome */}
          <div className="flex shrink-0 items-center border-b border-white/10 px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500/70" />
              <span className="size-2.5 rounded-full bg-amber-500/70" />
              <span className="size-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <div className="mx-auto rounded bg-white/5 px-3 py-1 text-[11px] text-white/40">
              tudominio.com/blog{activePost ? `/${activePost.slug}` : ""}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loadingPost ? (
              <div className="flex h-full items-center justify-center">
                <Loader2Icon className="size-5 animate-spin text-white/40" />
              </div>
            ) : activePost ? (
              <PostDetailView post={activePost} onBack={() => setActivePost(null)} />
            ) : (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white">{blog.name}</h2>

                {published.length === 0 ? (
                  <p className="mt-10 text-center text-sm text-white/40">Aún no hay posts publicados.</p>
                ) : view === "grid" ? (
                  <GridView posts={published} onOpen={handleOpenPost} />
                ) : view === "list" ? (
                  <ListView posts={published} onOpen={handleOpenPost} />
                ) : view === "carousel" ? (
                  <CarouselView posts={published} onOpen={handleOpenPost} />
                ) : (
                  <MagazineView posts={published} onOpen={handleOpenPost} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ViewProps {
  posts: BlogPostRaw[]
  onOpen: (post: BlogPostRaw) => void
}

function GridView({ posts, onOpen }: ViewProps) {
  return (
    <div className="mt-6 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {posts.map((post) => (
        <PreviewCard key={post.id} post={post} onOpen={onOpen} />
      ))}
    </div>
  )
}

function ListView({ posts, onOpen }: ViewProps) {
  return (
    <div className="mt-6 divide-y divide-white/10">
      {posts.map((post) => {
        const date = post.published_at ?? post.created_at
        const category = getCategory(post)
        return (
          <div
            key={post.id}
            onClick={() => onOpen(post)}
            className="group flex cursor-pointer gap-4 py-4 first:pt-0"
          >
            <div className="size-20 shrink-0 overflow-hidden rounded-md bg-white/5">
              {post.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.thumbnail_url} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <ImageIcon className="size-4 text-white/20" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {category && (
                <span className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">{category}</span>
              )}
              <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-white group-hover:underline">
                {post.title}
              </h3>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/40">
                {post.author?.name && (
                  <>
                    <span>{post.author.name}</span>
                    <span>·</span>
                  </>
                )}
                <span>
                  {new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CarouselView({ posts, onOpen }: ViewProps) {
  return (
    <div className="-mx-8 mt-6 flex gap-5 overflow-x-auto px-8 pb-2">
      {posts.map((post) => (
        <div key={post.id} className="w-56 shrink-0">
          <PreviewCard post={post} onOpen={onOpen} />
        </div>
      ))}
    </div>
  )
}

function MagazineView({ posts, onOpen }: ViewProps) {
  const [hero, ...rest] = posts
  return (
    <div className="mt-6 space-y-8">
      <HeroCard post={hero} onOpen={onOpen} />
      {rest.length > 0 && (
        <div
          className="grid gap-6 border-t border-white/10 pt-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
        >
          {rest.map((post) => (
            <PreviewCard key={post.id} post={post} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}

function HeroCard({ post, onOpen }: { post: BlogPostRaw; onOpen: (post: BlogPostRaw) => void }) {
  const date = post.published_at ?? post.created_at
  const category = getCategory(post)
  return (
    <div className="group cursor-pointer" onClick={() => onOpen(post)}>
      <div className="aspect-21/9 overflow-hidden rounded-lg bg-white/5">
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-6 text-white/20" />
          </div>
        )}
      </div>
      <div className="mt-4 max-w-2xl">
        {category && (
          <span className="text-xs font-semibold tracking-wide text-white/40 uppercase">{category}</span>
        )}
        <h2 className="mt-1.5 text-xl font-bold text-white group-hover:underline">{post.title}</h2>
        <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
          {post.author?.name && (
            <>
              <span>{post.author.name}</span>
              <span>·</span>
            </>
          )}
          <span>
            {new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  )
}

function PreviewCard({ post, onOpen }: { post: BlogPostRaw; onOpen: (post: BlogPostRaw) => void }) {
  const date = post.published_at ?? post.created_at
  const category = getCategory(post)

  return (
    <div className="group cursor-pointer text-left" onClick={() => onOpen(post)}>
      <div className="aspect-video overflow-hidden rounded-lg bg-white/5">
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-5 text-white/20" />
          </div>
        )}
      </div>
      <div className="pt-3">
        {category && (
          <span className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">{category}</span>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white">{post.title}</h3>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-white/40">
          {post.author?.name && (
            <>
              <span>{post.author.name}</span>
              <span>·</span>
            </>
          )}
          <span>
            {new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Post detail (vista de un post abierto) ────────────────────────────────────

function PostDetailView({ post, onBack }: { post: BlogPostDetailRaw; onBack: () => void }) {
  const date = post.published_at ?? post.created_at
  const tags = getTagList(post)

  return (
    <article className="p-8">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 mb-5 flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white"
      >
        <ArrowLeftIcon className="size-3.5" /> Volver al blog
      </button>

      {tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70">
              {tag}
            </span>
          ))}
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight text-white">{post.title}</h1>

      <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
        {post.author?.name && (
          <>
            <span className="font-medium text-white/60">{post.author.name}</span>
            <span>·</span>
          </>
        )}
        <span>
          {new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-white/40">Compartir:</span>
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/90 text-white">
            <MessageCircleIcon className="size-3" />
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-sky-600/90 text-white">
            <LinkedInIcon className="size-3" />
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-white">
            <XSocialIcon className="size-3" />
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-white">
            <LinkIcon className="size-3" />
          </span>
        </div>
      </div>

      {post.thumbnail_url && (
        <div className="mt-5 aspect-video overflow-hidden rounded-lg bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.thumbnail_url} alt="" className="size-full object-cover" />
        </div>
      )}

      <div
        className="mt-8 max-w-none space-y-4 text-sm leading-relaxed text-white/80 [&_a]:text-white [&_a]:underline [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_strong]:font-semibold [&_strong]:text-white"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  )
}
