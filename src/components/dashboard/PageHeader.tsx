import { type LucideIcon, SearchIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AIAssistantToggle } from "@/components/dashboard/ai/AIAssistantToggle";
import { BellButton } from "@/components/dashboard/BellButton";
import { CreateQuickMenu } from "@/components/dashboard/CreateQuickMenu";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="shrink-0" />
        <Separator orientation="vertical" className="shrink-0 data-vertical:h-5 data-vertical:self-auto" />
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="hidden truncate text-xs text-muted-foreground md:block">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Ocultos por ahora: falta conectar. Descomentar cuando se retomen. */}
        {/* <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-15 py-1.5 text-sm text-muted-foreground">
          <SearchIcon className="size-3.5" />
          <span>Buscar en CRM</span>
        </div> */}
        {/* <CreateQuickMenu /> */}
        <ThemeToggle />
        {/* <AIAssistantToggle /> */}
        <BellButton />
      </div>
    </header>
  );
}
