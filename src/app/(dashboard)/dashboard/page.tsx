"use client"

import * as React from "react"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ActivityIcon, Building2Icon, FileTextIcon, LayoutDashboardIcon, TrophyIcon, UsersIcon, XCircleIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { DotMatrixStatCard } from "@/components/dashboard/overview/DotMatrixStatCard"
// import { FollowUpTableCard } from "@/components/dashboard/overview/FollowUpTableCard" // oculto por ahora
import { FormAnswersCard } from "@/components/dashboard/overview/FormAnswersCard"
import { FunnelOverviewSection } from "@/components/dashboard/overview/FunnelOverviewSection"
import { MailPreviewCard } from "@/components/dashboard/overview/MailPreviewCard"
import { MessagingActivityCard } from "@/components/dashboard/overview/MessagingActivityCard"
import { MiniCalendarCard } from "@/components/dashboard/overview/MiniCalendarCard"
import { OpenOpportunitiesCard } from "@/components/dashboard/overview/OpenOpportunitiesCard"
// import { PipelineValueCard } from "@/components/dashboard/overview/PipelineValueCard" // oculto por ahora
import { ReferenceCardExample } from "@/components/dashboard/overview/ReferenceCardExample"
import { ReferenceCardExample2 } from "@/components/dashboard/overview/ReferenceCardExample2"
import { ReferenceCardExample3 } from "@/components/dashboard/overview/ReferenceCardExample3"
import { ReferenceCardExample4 } from "@/components/dashboard/overview/ReferenceCardExample4"
import { ReferenceCardExample5 } from "@/components/dashboard/overview/ReferenceCardExample5"
import { ReferenceCardExample6 } from "@/components/dashboard/overview/ReferenceCardExample6"
import { ReferenceCardExample7 } from "@/components/dashboard/overview/ReferenceCardExample7"
import { ReferenceCardExample8 } from "@/components/dashboard/overview/ReferenceCardExample8"
import { ReferenceCardExample9 } from "@/components/dashboard/overview/ReferenceCardExample9"
import { ReferenceCardExample10 } from "@/components/dashboard/overview/ReferenceCardExample10"
import { ReferenceCardExample11 } from "@/components/dashboard/overview/ReferenceCardExample11"
import { ReferenceCardExample12 } from "@/components/dashboard/overview/ReferenceCardExample12"
import { ReferenceCardExample13 } from "@/components/dashboard/overview/ReferenceCardExample13"
import { ReferenceCardExample14 } from "@/components/dashboard/overview/ReferenceCardExample14"
import { ReferenceCardExample15 } from "@/components/dashboard/overview/ReferenceCardExample15"
import { ReferenceCardExample16 } from "@/components/dashboard/overview/ReferenceCardExample16"
import { ReferenceCardExample17 } from "@/components/dashboard/overview/ReferenceCardExample17"
import { SalesOpportunitiesSection } from "@/components/dashboard/overview/SalesOpportunitiesSection"
import { SalesQuotationsSection } from "@/components/dashboard/overview/SalesQuotationsSection"
import { SimpleStatCard } from "@/components/dashboard/overview/SimpleStatCard"
import { TeamMembersCard } from "@/components/dashboard/overview/TeamMembersCard"
import { WorkspaceHistoryCard } from "@/components/dashboard/overview/WorkspaceHistoryCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TABS = [
  { value: "general",     label: "General"     },
  { value: "ventas",      label: "Ventas"      },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "referencias", label: "Referencias" },
]
const VALID_TABS = new Set(TABS.map((t) => t.value))

function ComingSoon() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="text-sm font-medium">Próximamente</p>
      <p className="text-xs text-muted-foreground">Estamos trabajando en esta funcionalidad.</p>
    </div>
  )
}

function DashboardPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // La pestaña activa vive en la URL (?tab=ventas), no en un estado interno — así un
  // F5 (o compartir el link) vuelve exactamente a donde estabas. Mismo patrón que el
  // detalle de Oportunidades (Col2Tabs).
  const tabParam = searchParams.get("tab")
  const activeTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "general"

  const ventasSubTabParam = searchParams.get("ventasTab")
  const activeVentasSubTab = ventasSubTabParam === "cotizaciones" ? "cotizaciones" : "oportunidades"

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function handleVentasSubTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("ventasTab", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <PageHeader
        icon={LayoutDashboardIcon}
        title="Dashboard"
        description="Los principales indicadores de tu espacio de trabajo"
      />
      <main className="flex flex-1 flex-col overflow-y-auto p-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-1 flex-col gap-4">
          <TabsList variant="line" className="w-fit">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general" className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <OpenOpportunitiesCard />
              <DotMatrixStatCard
                title="Oportunidades Ganadas"
                kpiKey="wonOpportunities"
                icon={TrophyIcon}
                goodDirection="up"
                barHeights={[2, 3, 2, 4, 3, 5, 4, 6, 6]}
              />
              <DotMatrixStatCard
                title="Oportunidades Perdidas"
                kpiKey="lostOpportunities"
                icon={XCircleIcon}
                goodDirection="down"
                barHeights={[3, 2, 4, 3, 2, 4, 3, 2, 3]}
              />
            </div>

            {/* <PipelineValueCard /> */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SimpleStatCard title="Total de Contactos" kpiKey="totalContacts" icon={UsersIcon} goodDirection="up" trendLabel="Nuevos" />
              <SimpleStatCard title="Total de Organizaciones" kpiKey="totalOrganizations" icon={Building2Icon} goodDirection="up" trendLabel="Nuevas" />
              <SimpleStatCard title="Total de Cotizaciones" kpiKey="totalQuotations" icon={FileTextIcon} goodDirection="up" trendLabel="Nuevas" />
              <SimpleStatCard title="Total de Actividades" kpiKey="totalActivities" icon={ActivityIcon} goodDirection="up" />
            </div>

            {/* Historial más ancho que Calendario/Usuarios — misma altura fija (h-92)
                en los 3, con scroll interno. */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
              <div className="lg:col-span-3">
                <WorkspaceHistoryCard />
              </div>
              <div className="lg:col-span-2">
                <MiniCalendarCard />
              </div>
              <div className="lg:col-span-2">
                <TeamMembersCard />
              </div>
            </div>

            {/* Actividad de otros canales — misma altura fija (h-92) que la fila de
                arriba, con scroll interno para que no crezca con muchos resultados. */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <FormAnswersCard />
              <MessagingActivityCard />
              <MailPreviewCard />
            </div>

            {/* Adaptación real de las referencias 10 y 11 — mismo embudo/selector
                compartido entre ambas cards. */}
            <FunnelOverviewSection />

            {/* <FollowUpTableCard /> */}
          </TabsContent>

          <TabsContent value="ventas" className="flex flex-col gap-4">
            <Tabs value={activeVentasSubTab} onValueChange={handleVentasSubTabChange} className="flex flex-1 flex-col gap-4">
              <TabsList variant="line" className="w-fit">
                <TabsTrigger value="oportunidades">Por Oportunidades</TabsTrigger>
                <TabsTrigger value="cotizaciones">Por Cotizaciones</TabsTrigger>
              </TabsList>

              <TabsContent value="oportunidades" className="flex flex-col gap-4">
                <SalesOpportunitiesSection />
              </TabsContent>

              <TabsContent value="cotizaciones" className="flex flex-col gap-4">
                <SalesQuotationsSection />
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="seguimiento"><ComingSoon /></TabsContent>

          <TabsContent value="referencias" className="flex flex-col gap-4">
            {/* Mockups para consulta futura (diseño), no son datos reales — quedan
                acá aparte para no mezclarse con el contenido real del Dashboard. */}
            <p className="text-xs text-muted-foreground">
              Referencias visuales guardadas para uso futuro — no son datos reales.
            </p>
            <div className="flex flex-col gap-3">
              <ReferenceCardExample />
              <ReferenceCardExample2 />
              <ReferenceCardExample3 />
              <ReferenceCardExample4 />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <ReferenceCardExample5 />
                <ReferenceCardExample6 />
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <ReferenceCardExample7 />
                <ReferenceCardExample8 />
                <ReferenceCardExample9 />
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <ReferenceCardExample10 />
                <ReferenceCardExample11 />
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <ReferenceCardExample12 />
                <ReferenceCardExample13 />
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <ReferenceCardExample14 />
                <ReferenceCardExample15 />
                <ReferenceCardExample16 />
              </div>
              <ReferenceCardExample17 />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageContent />
    </Suspense>
  )
}
