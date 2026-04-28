"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon, Trash2Icon } from "lucide-react"
import type { OrganizationDetail } from "../../data"

interface Props {
  organization: OrganizationDetail
}

export function DesafiosTab({ organization }: Props) {
  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-end border-b px-4 py-2.5">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <PlusIcon className="size-3.5" /> Agregar desafío
        </Button>
      </div>

      {/* List */}
      <div className="divide-y">
        {organization.challenges.map((challenge) => (
          <div key={challenge.id} className="flex items-start gap-3.5 px-4 py-4">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {challenge.order_number}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed">{challenge.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">{challenge.created_at}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ))}

        {organization.challenges.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Sin desafíos registrados.
          </p>
        )}
      </div>

    </div>
  )
}
