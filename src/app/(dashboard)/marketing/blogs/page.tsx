import { BookOpenIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BlogsTable } from "@/components/dashboard/blogs/BlogsTable";

export default function BlogsPage() {
  return (
    <>
      <PageHeader icon={BookOpenIcon} title="Blog" description="Gestiona el contenido de tu blog" />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <BlogsTable />
      </main>
    </>
  );
}