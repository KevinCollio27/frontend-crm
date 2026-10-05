"use client"

import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ArrowUpRightIcon,
  BadgeCheck,
  ChevronDownIcon,
} from "lucide-react"
import type { ActivityRaw } from "@/types/activity"
import { ActivityStatusPicker } from "./ActivityStatusPicker"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-3.5 py-3 transition-colors hover:bg-muted/30">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function EmptySection({ title, message }: { title: string; message: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b px-3.5 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
      </div>
      <div className="px-3.5 py-3">
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  activity:       ActivityRaw
  onStatusChange: (updates: Partial<ActivityRaw>) => void
}

export function Col3Related({ activity, onStatusChange }: Props) {
  const person       = activity.opportunity?.person
  const organization = activity.opportunity?.organization

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Estado */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="px-3.5 pb-3 pt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Estado
          </span>
          <div className="mt-2.5">
            <ActivityStatusPicker activity={activity} onStatusChange={onStatusChange} />
          </div>
        </div>
      </div>

      {/* Contacto */}
      {person ? (
        <CollapsibleSection title="Contacto">
          <div className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt={person.name} />
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
                <BadgeCheck className="absolute -bottom-1 -right-1 size-4.5 rounded-full fill-blue-500 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">Contacto asociado</p>
              </div>
              <Link
                href={`/crm/contacts/${person.id}`}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowUpRightIcon className="size-3.5" />
              </Link>
            </div>
          </div>
        </CollapsibleSection>
      ) : (
        <EmptySection title="Contacto" message="Sin contacto asociado." />
      )}

      {/* Empresa */}
      {organization ? (
        <CollapsibleSection title="Empresa">
          <div className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt={organization.name} />
                  <AvatarFallback>{initials(organization.name)}</AvatarFallback>
                </Avatar>
                <BadgeCheck className="absolute -bottom-1 -right-1 size-4.5 rounded-full fill-blue-500 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{organization.name}</p>
                <p className="truncate text-xs text-muted-foreground">Empresa asociada</p>
              </div>
              <Link
                href={`/crm/organizations/${organization.id}`}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowUpRightIcon className="size-3.5" />
              </Link>
            </div>
          </div>
        </CollapsibleSection>
      ) : (
        <EmptySection title="Empresa" message="Sin empresa asociada." />
      )}

    </div>
  )
}
