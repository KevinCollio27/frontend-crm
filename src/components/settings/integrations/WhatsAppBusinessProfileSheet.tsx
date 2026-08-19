"use client"

import * as React from "react"
import { ImageIcon, LoaderCircleIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { notify } from "@/lib/notify"
import { whatsappService } from "@/services/whatsapp.service"

interface WhatsAppBusinessProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const VERTICAL_OPTIONS: { value: string; label: string }[] = [
  { value: "UNDEFINED", label: "Sin definir" },
  { value: "OTHER", label: "Otro" },
  { value: "AUTO", label: "Automotriz" },
  { value: "BEAUTY", label: "Belleza, spa y salón" },
  { value: "APPAREL", label: "Ropa y moda" },
  { value: "EDU", label: "Educación" },
  { value: "ENTERTAIN", label: "Entretenimiento" },
  { value: "EVENT_PLAN", label: "Organización de eventos" },
  { value: "FINANCE", label: "Finanzas y banca" },
  { value: "GROCERY", label: "Almacén / supermercado" },
  { value: "GOVT", label: "Gobierno" },
  { value: "HOTEL", label: "Hotelería" },
  { value: "HEALTH", label: "Salud" },
  { value: "NONPROFIT", label: "Sin fines de lucro" },
  { value: "PROF_SERVICES", label: "Servicios profesionales" },
  { value: "RETAIL", label: "Retail" },
  { value: "TRAVEL", label: "Viajes y transporte" },
  { value: "RESTAURANT", label: "Restaurante" },
  { value: "NOT_A_BIZ", label: "No es un negocio" },
]

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const TEXTAREA_CLASS =
  "min-h-20 w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"

export function WhatsAppBusinessProfileSheet({ open, onOpenChange }: WhatsAppBusinessProfileSheetProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false)

  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null)
  const [about, setAbout] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [website1, setWebsite1] = React.useState("")
  const [website2, setWebsite2] = React.useState("")
  const [vertical, setVertical] = React.useState("UNDEFINED")

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    whatsappService
      .getBusinessProfile()
      .then((profile) => {
        setPhotoUrl(profile.profilePictureUrl)
        setAbout(profile.about ?? "")
        setDescription(profile.description ?? "")
        setAddress(profile.address ?? "")
        setEmail(profile.email ?? "")
        setWebsite1(profile.websites[0] ?? "")
        setWebsite2(profile.websites[1] ?? "")
        setVertical(profile.vertical ?? "UNDEFINED")
      })
      .catch(() => {
        notify.error({ title: "No se pudo cargar el perfil", description: "Intenta de nuevo en unos segundos." })
      })
      .finally(() => setLoading(false))
  }, [open])

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingPhoto(true)
    try {
      const base64 = await fileToBase64(file)
      const url = await whatsappService.uploadBusinessProfilePhoto(file.name, base64)
      setPhotoUrl(url)
    } catch {
      notify.error({ title: "No se pudo subir la foto", description: "Prueba con un JPG o PNG." })
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await whatsappService.updateBusinessProfile({
        about: about.trim(),
        description: description.trim(),
        address: address.trim(),
        email: email.trim(),
        websites: [website1.trim(), website2.trim()].filter(Boolean),
        vertical,
        photoUrl,
      })
      notify.success({ title: "Perfil actualizado", description: "Los cambios ya están visibles en WhatsApp." })
      onOpenChange(false)
    } catch {
      notify.error({ title: "No se pudo actualizar el perfil", description: "Meta rechazó alguno de los campos — revisa los formatos e intenta de nuevo." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} style={{ maxWidth: 460, padding: 0, gap: 0 }} className="w-full!">
        <div className="flex items-start justify-between border-b p-5">
          <div className="space-y-0.5">
            <SheetTitle>Perfil de WhatsApp Business</SheetTitle>
            <SheetDescription>Lo que ven tus clientes al abrir la conversación — se actualiza directo en Meta, sin revisión.</SheetDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={() => onOpenChange(false)} aria-label="Cerrar">
            <XIcon />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <LoaderCircleIcon className="size-5 animate-spin" />
            </div>
          ) : (
            <>
              <Field label="Foto de perfil">
                <div className="flex items-center gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Foto de perfil" className="size-full object-cover" />
                    ) : (
                      <ImageIcon className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" disabled={uploadingPhoto} onClick={() => fileInputRef.current?.click()}>
                    {uploadingPhoto && <LoaderCircleIcon className="size-4 animate-spin" />}
                    Elegir archivo
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
                </div>
              </Field>

              <Field label="About" description={`${about.length}/139 — el estado que se ve junto al nombre`}>
                <Input value={about} maxLength={139} onChange={(e) => setAbout(e.target.value)} placeholder="Ej. Respondemos en horario hábil" />
              </Field>

              <Field label="Descripción" description={`${description.length}/512`}>
                <textarea
                  className={TEXTAREA_CLASS}
                  value={description}
                  maxLength={512}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cuéntale a tus clientes a qué se dedica la empresa"
                />
              </Field>

              <Field label="Categoría">
                <Select value={vertical} onValueChange={(v) => setVertical(v ?? "UNDEFINED")}>
                  <SelectTrigger className="w-full" aria-label="Categoría">
                    <SelectValue placeholder="Selecciona una categoría">
                      {(v: string) => VERTICAL_OPTIONS.find((o) => o.value === v)?.label ?? v}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {VERTICAL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Dirección" description="Opcional">
                <Input value={address} maxLength={256} onChange={(e) => setAddress(e.target.value)} placeholder="Cerro El Plomo 5931, Oficina 510" />
              </Field>

              <Field label="Correo electrónico" description="Opcional">
                <Input type="email" value={email} maxLength={128} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@empresa.com" />
              </Field>

              <Field label="Sitio web 1" description="Opcional">
                <Input value={website1} maxLength={256} onChange={(e) => setWebsite1(e.target.value)} placeholder="https://empresa.com" />
              </Field>

              <Field label="Sitio web 2" description="Opcional">
                <Input value={website2} maxLength={256} onChange={(e) => setWebsite2(e.target.value)} placeholder="https://tienda.empresa.com" />
              </Field>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" disabled={loading || saving} onClick={handleSave}>
            {saving && <LoaderCircleIcon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
