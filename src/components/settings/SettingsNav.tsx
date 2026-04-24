"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2Icon,
  CreditCardIcon,
  FilterIcon,
  KeyIcon,
  PackageIcon,
  PlugIcon,
  ScrollTextIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Cuenta",
    items: [
      { label: "Perfil", href: "/settings/profile", icon: UserIcon },
      { label: "Workspace", href: "/settings/workspace", icon: Building2Icon },
      { label: "Billing", href: "/settings/billing", icon: CreditCardIcon },
    ],
  },
  {
    label: "Equipo",
    items: [
      { label: "Usuarios", href: "/settings/team", icon: UsersIcon },
      { label: "Historial", href: "/settings/activity", icon: ScrollTextIcon },
    ],
  },
  {
    label: "Datos",
    items: [
      { label: "Catálogos", href: "/settings/catalogs", icon: TagIcon },
      { label: "Productos", href: "/settings/products", icon: PackageIcon },
      { label: "Embudos", href: "/settings/funnels", icon: FilterIcon },
    ],
  },
  {
    label: "Desarrolladores",
    items: [
      { label: "Integraciones", href: "/settings/integrations", icon: PlugIcon },
      { label: "API", href: "/settings/api", icon: KeyIcon },
    ],
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="w-52 shrink-0 border-r p-3 flex flex-col gap-5">
      {navGroups.map((group, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {group.label && (
            <p className="px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
