import { ProfileForm } from "@/components/settings/profile/ProfileForm"

export default function ProfilePage() {
  return (
    <div className="p-6 space-y-1">
      <h1 className="text-xl font-semibold">Perfil</h1>
      <p className="text-sm text-muted-foreground">Gestiona tu información personal y contraseña</p>
      <div className="pt-4">
        <ProfileForm />
      </div>
    </div>
  )
}
