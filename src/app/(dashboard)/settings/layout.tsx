import { SettingsIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { SettingsNav } from "@/components/settings/SettingsNav"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        icon={SettingsIcon}
        title="Configuración"
        description="Gestiona tu cuenta y workspace"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SettingsNav />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
