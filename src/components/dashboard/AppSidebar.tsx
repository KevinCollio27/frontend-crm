"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLinkIcon, HomeIcon, LifeBuoyIcon, MegaphoneIcon, Plug, SettingsIcon, Sparkle, TruckIcon, UsersIcon } from "lucide-react"
import { NavMain } from "@/components/dashboard/NavMain"
import { NavUser } from "@/components/dashboard/NavUser"
import { TeamSwitcher } from "@/components/dashboard/TeamSwitcher"
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

const data = {
  user: {
    name: "Kevin Collio",
    email: "kevincollio27@gmail.com",
    avatar: "https://github.com/shadcn.png",
  },
  workspace: [
    {
      name: "GOXT CRM",
      logo: <img src="https://github.com/shadcn.png" alt="GOXT" className="size-full rounded-lg object-cover" />,
      plan: "Workspace",
    },
  ],
  navMain: [
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
      title: "Integraciones",
      url: "#",
      icon: <Plug />,
      items: [
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
        { title: "Blog", url: "/marketing/blogs" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.workspace} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/home" />} tooltip="Home">
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
        <NavMain items={data.navMain} />
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
