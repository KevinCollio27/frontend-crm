import { HomeIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { SetupGuide } from "@/components/home/SetupGuide"

export default function HomePage() {
  return (
    <>
      <PageHeader icon={HomeIcon} title="Home" description="Bienvenido a tu panel de control" />
      <main className="flex-1 overflow-y-auto p-6">
        <SetupGuide />
      </main>
    </>
  )
}
