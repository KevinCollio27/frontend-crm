"use client"

import * as React from "react"
import Link from "next/link"
import {
  ActivityIcon,
  BookOpenIcon,
  BotIcon,
  BuildingIcon,
  CalendarHeart,
  ClipboardListIcon,
  CloudUpload,
  ExternalLinkIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MailIcon,
  MegaphoneIcon,
  MessagesSquareIcon,
  Plug,
  SendIcon,
  SettingsIcon,
  Sparkle,
  TrendingUpIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react"
import { NavMain } from "@/components/dashboard/NavMain"
import { NavUser } from "@/components/dashboard/NavUser"
import { TeamSwitcher } from "@/components/dashboard/TeamSwitcher"
import { useSessionStore } from "@/store/session.store"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "CRM",
    url: "#",
    icon: <UsersIcon />,
    items: [
      { title: "Funnels", url: "/crm/funnels", icon: <TrendingUpIcon /> },
      { title: "Contactos", url: "/crm/contacts", icon: <UsersIcon /> },
      { title: "Organizaciones", url: "/crm/organizations", icon: <BuildingIcon /> },
      { title: "Actividades", url: "/crm/activities", icon: <ActivityIcon /> },
      { title: "Cotizaciones", url: "/crm/quotations", icon: <FileTextIcon /> },
      { title: "Documentos", url: "/crm/documents", icon: <CloudUpload /> },
    ],
  },
  {
    title: "Comunicaciones",
    url: "#",
    icon: <Plug />,
    items: [
      { title: "Mensajeria", url: "/crm/messaging", icon: <MessagesSquareIcon /> },
      { title: "Correo", url: "/crm/mail", icon: <MailIcon /> },
      { title: "Calendario", url: "/crm/calendaries", icon: <CalendarHeart /> },
    ],
  },
  {
    title: "Marketing",
    url: "#",
    icon: <MegaphoneIcon />,
    items: [
      { title: "Campañas", url: "/marketing/campaigns", icon: <SendIcon /> },
      { title: "Formularios", url: "/marketing/forms", icon: <ClipboardListIcon /> },
      { title: "Widgets AI", url: "/marketing/widget-ai", icon: <BotIcon /> },
      { title: "Blog", url: "/marketing/blogs", icon: <BookOpenIcon /> },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSessionStore((s) => s.user)
  const isLoading = useSessionStore((s) => s.isLoading)

  const currentUser = {
    name: user?.name ?? "",
    email: user?.email ?? "",
    avatar: user?.avatar_url ?? "https://github.com/shadcn.png",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/dashboard" />} tooltip="Dashboard">
                <LayoutDashboardIcon />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/chat" />} tooltip="Chat IA">
                <Sparkle />
                <span>Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavMain items={navMain} />
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                render={<a href="https://cargo.goxt.io/" target="_blank" rel="noreferrer" />}
                tooltip="TMS Cargo"
              >
                <TruckIcon />
                <span>TMS Cargo</span>
                <ExternalLinkIcon className="ml-auto size-3 opacity-60" />
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                render={<a href="https://docs.goxt.io/docs/crm" target="_blank" rel="noreferrer" />}
                tooltip="Documentación"
              >
                <BookOpenIcon />
                <span>Documentación</span>
                <ExternalLinkIcon className="ml-auto size-3 opacity-60" />
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                render={<a href={`${process.env.NEXT_PUBLIC_WIDGET_BASE_URL}/widget/form/formulario-de-soporte`} target="_blank" rel="noreferrer" />}
                tooltip="Soporte / Ayuda"
              >
                <LifeBuoyIcon />
                <span>Soporte / Ayuda</span>
                <ExternalLinkIcon className="ml-auto size-3 opacity-60" />
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                render={<Link href="/settings/profile" />}
                tooltip="Configuración"
              >
                <SettingsIcon />
                <span>Configuración</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} isLoading={isLoading} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
