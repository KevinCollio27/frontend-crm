import { cookies } from "next/headers";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WelcomeToast } from "@/components/home/WelcomeToast";
import { WorkspaceLinkHandler } from "@/components/home/WorkspaceLinkHandler";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh overflow-hidden">
      <WelcomeToast />
      <WorkspaceLinkHandler />
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <DashboardShell>{children}</DashboardShell>
      </SidebarInset>
    </SidebarProvider>
  );
}
