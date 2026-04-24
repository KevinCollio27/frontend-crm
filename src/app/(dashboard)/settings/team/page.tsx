import { InvitedUsersTable } from "@/components/settings/team/InvitedUsersTable"
import { UsersTable } from "@/components/settings/team/UsersTable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TeamPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Equipo</h1>
        <p className="text-sm text-muted-foreground">Gestiona los miembros e invitaciones de tu workspace</p>
      </div>
      <Tabs defaultValue="users">
        <TabsList variant="line">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="invited">Invitados</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersTable />
        </TabsContent>
        <TabsContent value="invited">
          <InvitedUsersTable />
        </TabsContent>
      </Tabs>
    </main>
  )
}
