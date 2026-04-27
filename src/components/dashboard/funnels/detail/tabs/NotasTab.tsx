"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import type { DealDetail } from "../../data"

const DOT_COLORS = [
  "bg-blue-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
]

interface Props {
  deal: DealDetail
}

export function NotasTab({ deal }: Props) {
  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-end border-b px-4 py-2.5">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <PlusIcon className="size-3.5" /> Agregar nota
        </Button>
      </div>

      {/* List */}
      <div className="divide-y">
        {deal.notes.map((note, i) => (
          <div key={note.id} className="flex gap-3.5 px-4 py-4">
            <div className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug">{note.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{note.created_at}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 hover:bg-red-50 hover:text-red-600">
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {note.content}
              </p>
              {note.tags && note.tags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="rounded-full border bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
