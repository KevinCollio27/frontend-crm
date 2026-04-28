"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon, Trash2Icon } from "lucide-react"
import type { ContactDetail } from "../../data"

interface Props {
  contact: ContactDetail
}

export function InteresesTab({ contact }: Props) {
  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-end border-b px-4 py-2.5">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <PlusIcon className="size-3.5" /> Agregar interés
        </Button>
      </div>

      {/* List */}
      <div className="divide-y">
        {contact.interests.map((interest) => (
          <div key={interest.id} className="flex items-start gap-3.5 px-4 py-4">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {interest.order_number}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed">{interest.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">{interest.created_at}</p>
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

        {contact.interests.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Sin intereses registrados.
          </p>
        )}
      </div>

    </div>
  )
}
