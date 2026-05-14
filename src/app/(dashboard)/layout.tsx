import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WelcomeToast } from "@/components/home/WelcomeToast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <WelcomeToast />
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <DashboardShell>{children}</DashboardShell>
      </SidebarInset>
    </SidebarProvider>
  );
}
