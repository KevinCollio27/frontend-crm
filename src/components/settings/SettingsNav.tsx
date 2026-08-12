"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2Icon,
  CreditCardIcon,
  DatabaseIcon,
  FilterIcon,
  KeyIcon,
  LayoutTemplateIcon,
  LineChartIcon,
  PackageIcon,
  PlugIcon,
  ScrollTextIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

// Exportado — el selector agrupado en mobile reusa esta misma lista.
export const navGroups: NavGroup[] = [
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
      { label: "Plantillas", href: "/settings/pdf-templates", icon: LayoutTemplateIcon },
    ],
  },
  {
    label: "Desarrolladores",
    items: [
      { label: "Integraciones", href: "/settings/integrations", icon: PlugIcon },
      { label: "API", href: "/settings/api", icon: KeyIcon },
      { label: "Observabilidad", href: "/settings/observability", icon: LineChartIcon },
      { label: "Datasources", href: "/settings/datasources", icon: DatabaseIcon },
    ],
  },
]

export function SettingsNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpen } = useSidebar()

  useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, [])

  const allItems = navGroups.flatMap((g) => g.items)

  return (
    <>
      {/* Mobile — selector agrupado, reemplaza al nav fijo. Aterriza directo en
          el contenido (Perfil, por el redirect de /settings) igual que antes —
          acá solo se cambia de sección, sin paso de "menú" previo. */}
      <div className="w-full shrink-0 border-b p-2 md:hidden">
        <Select value={pathname} onValueChange={(v) => { if (v) router.push(v) }}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="Sección">
              {(v: string) => {
                const item = allItems.find((i) => i.href === v)
                if (!item) return v
                return (
                  <span className="flex items-center gap-1.5">
                    <item.icon className="size-3.5" />
                    {item.label}
                  </span>
                )
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {navGroups.map((group, i) => (
              <SelectGroup key={i}>
                {group.label && <SelectLabel>{group.label}</SelectLabel>}
                {group.items.map((item) => (
                  <SelectItem key={item.href} value={item.href}>
                    <item.icon className="size-3.5" />
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop — nav original, sin cambios */}
      <nav className="hidden w-52 shrink-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-r p-3 md:flex md:flex-col gap-5">
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
    </>
  )
}
