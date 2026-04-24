import { type LucideIcon, BellIcon, PlusIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="data-vertical:h-5 data-vertical:self-auto" />
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-15 py-1.5 text-sm text-muted-foreground">
          <SearchIcon className="size-3.5" />
          <span>Buscar en CRM</span>
        </div>
        <Button variant="outline" size="icon" className="rounded-full">
          <PlusIcon className="size-4" />
        </Button>
        <Button
          size="icon"
          className="rounded-full bg-linear-to-br from-purple-500 to-violet-600 text-white shadow-sm hover:from-purple-600 hover:to-violet-700 border-0"
        >
          <SparklesIcon className="size-4" />
        </Button>
        <Button
          size="icon"
          className="rounded-full bg-amber-50 text-amber-500 border border-amber-200 shadow-sm hover:bg-amber-100 hover:text-amber-600"
        >
          <BellIcon className="size-4" />
        </Button>
      </div>
    </header>
  );
}
