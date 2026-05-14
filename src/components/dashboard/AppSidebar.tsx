"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLinkIcon, HomeIcon, LifeBuoyIcon, MegaphoneIcon, Plug, SettingsIcon, Sparkle, TruckIcon, UsersIcon } from "lucide-react"
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
      { title: "Funnels", url: "/crm/funnels" },
      { title: "Contactos", url: "/crm/contacts" },
      { title: "Organizaciones", url: "/crm/organizations" },
      { title: "Actividades", url: "/crm/activities" },
      { title: "Documentos", url: "/crm/documents" },
    ],
  },
  {
    title: "Comunicaciones",
    url: "#",
    icon: <Plug />,
    items: [
      { title: "Mensajeria", url: "/crm/messaging" },
      { title: "Correo", url: "/crm/mail" },
      { title: "Calendario", url: "/crm/calendaries" },
    ],
  },
  {
    title: "Marketing",
    url: "#",
    icon: <MegaphoneIcon />,
    items: [
      { title: "Campañas", url: "/marketing/campaigns" },
      { title: "Formularios", url: "/marketing/forms" },
      { title: "Widgets AI", url: "/marketing/widget-ai" },
      { title: "Blog", url: "/marketing/blogs" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSessionStore((s) => s.user)

  const currentUser = {
    name: user?.name ?? "",
    email: user?.email ?? "",
    avatar: "",
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
              <SidebarMenuButton render={<Link href="/chat" />} tooltip="Chat IA">
                <Sparkle />
                <span>Chat</span>
              </SidebarMenuButton>
              <SidebarMenuButton render={<Link href="/home" />} tooltip="Home">
                <HomeIcon />
                <span>Home</span>
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
                render={<a href="https://ti.goxt.io/" target="_blank" rel="noreferrer" />}
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
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
