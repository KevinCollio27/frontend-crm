"use client";

import {
  PlusIcon,
  UserIcon,
  Building2Icon,
  TrendingUpIcon,
  CalendarCheckIcon,
  MailIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ITEMS = [
  { label: "Contacto",     icon: UserIcon,          color: "text-teal-600",   bg: "bg-teal-50"   },
  { label: "Organización", icon: Building2Icon,     color: "text-blue-600",   bg: "bg-blue-50"   },
  { label: "Oportunidad",  icon: TrendingUpIcon,    color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Actividad",    icon: CalendarCheckIcon, color: "text-amber-600",  bg: "bg-amber-50"  },
  { label: "Correo",       icon: MailIcon,          color: "text-rose-500",   bg: "bg-rose-50"   },
];

export function CreateQuickMenu() {
  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <TooltipTrigger
                render={<Button variant="outline" size="icon" className="rounded-full" />}
              />
            }
          >
            <PlusIcon className="size-4" />
          </DropdownMenuTrigger>

          <TooltipContent side="bottom">
            <PlusIcon className="size-3" />
            Crear nuevo
          </TooltipContent>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Crear nuevo
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ITEMS.map(({ label, icon: Icon, color, bg }) => (
                <DropdownMenuItem key={label}>
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-md ${bg}`}>
                    <Icon className={`size-3.5 ${color}`} />
                  </span>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
