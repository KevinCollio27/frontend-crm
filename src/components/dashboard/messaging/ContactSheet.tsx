"use client"

import * as React from "react"
import {
  ExternalLinkIcon,
  MailIcon,
  PhoneIcon,
  UserPlusIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { type Conversation, STATUS_CONFIG } from "./data"

interface ContactSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversation: Conversation
}

export function ContactSheet({ open, onOpenChange, conversation }: ContactSheetProps) {
  const isWsp      = conversation.channel === "whatsapp"
  const isIg       = conversation.channel === "instagram"
  const isFb       = conversation.channel === "facebook"
  const channelLabel = isWsp ? "WhatsApp" : isIg ? "Instagram" : isFb ? "Messenger" : conversation.widgetName ?? "Widget web"
  const hasContact = !!conversation.crmContactId
  const displayName = conversation.visitorName ?? "Visitante anónimo"
  const statusCfg  = STATUS_CONFIG[conversation.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-80 flex-col overflow-y-auto p-0 sm:max-w-80">

        {/* Avatar + nombre */}
        <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-10">
          <Avatar className="size-16">
            <AvatarImage src={conversation.visitorAvatarUrl || "https://github.com/shadcn.png"} alt="" />
            <AvatarFallback className="text-xl font-semibold">
              {conversation.visitorInitials}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <SheetTitle className="text-base font-semibold">{displayName}</SheetTitle>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", isWsp ? "bg-[#25D366]" : isIg ? "bg-pink-500" : isFb ? "bg-[#1877F2]" : "bg-blue-600")} />
              {channelLabel}
              {isIg && conversation.visitorUsername && <span>· @{conversation.visitorUsername}</span>}
            </div>
          </div>

          {/* Accesos rápidos — solo si el contacto ya está en el CRM */}
          {hasContact && (
            <div className="mt-1 flex gap-4">
              {conversation.visitorPhone && (
                <QuickAction icon={<PhoneIcon className="size-4" />} label="Llamar" />
              )}
              {conversation.visitorEmail && (
                <QuickAction icon={<MailIcon className="size-4" />} label="Email" />
              )}
              <QuickAction icon={<ExternalLinkIcon className="size-4" />} label="Ver perfil" />
            </div>
          )}
        </div>

        <Separator />

        {/* Campos de información */}
        <div className="px-4 py-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Información
          </p>
          <div className="flex flex-col">
            {conversation.visitorPhone && (
              <InfoRow label="Teléfono" value={conversation.visitorPhone} />
            )}
            {conversation.visitorUsername && (
              <InfoRow label="Instagram" value={`@${conversation.visitorUsername}`} />
            )}
            {conversation.visitorEmail && (
              <InfoRow label="Email" value={conversation.visitorEmail} />
            )}
            {conversation.companyName && (
              <InfoRow label="Empresa" value={conversation.companyName} />
            )}
            {!isWsp && conversation.widgetName && (
              <InfoRow label="Widget" value={conversation.widgetName} />
            )}
            <InfoRow
              label="Estado"
              value={
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  statusCfg.className
                )}>
                  {statusCfg.label}
                </span>
              }
            />
            <InfoRow label="Último mensaje" value={conversation.lastMessageAt} />
          </div>
        </div>

        <Separator />

        {/* CTA footer */}
        <div className="mt-auto p-4">
          {hasContact ? (
            <Button variant="outline" className="w-full gap-2 text-sm">
              <ExternalLinkIcon className="size-3.5" />
              Ver en CRM
            </Button>
          ) : (
            <Button className="w-full gap-2 text-sm">
              <UserPlusIcon className="size-3.5" />
              Agregar al CRM
            </Button>
          )}
        </div>

      </SheetContent>
    </Sheet>
  )
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button type="button" className="flex flex-col items-center gap-1">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </button>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2.5 last:border-0">
      <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className="truncate text-right text-[12px] text-foreground">{value}</span>
    </div>
  )
}
