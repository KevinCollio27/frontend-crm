import { BlogManager } from "@/components/dashboard/blogs/BlogManager"

export default async function BlogManagerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <BlogManager id={Number(id)} />
}
