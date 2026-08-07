"use client"

import * as React from "react"
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  type ChatConversation,
  type ChatDateGroup,
  DATE_GROUP_LABELS,
  DATE_GROUP_ORDER,
} from "./data"

interface ChatSidebarProps {
  conversations: ChatConversation[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, newTitle: string) => void
}

export function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: ChatSidebarProps) {
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q)
    )
  }, [conversations, search])

  const groups = React.useMemo(() => {
    const map = new Map<ChatDateGroup, ChatConversation[]>()
    for (const c of filtered) {
      if (!map.has(c.dateGroup)) map.set(c.dateGroup, [])
      map.get(c.dateGroup)!.push(c)
    }
    return map
  }, [filtered])

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <Button className="w-full justify-start gap-2" onClick={onNew}>
        <PlusIcon className="size-4" />
        Nueva conversación
      </Button>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          className="h-8 pl-8 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Sin resultados
          </p>
        ) : (
          DATE_GROUP_ORDER.map((group) => {
            const items = groups.get(group)
            if (!items?.length) return null
            return (
              <div key={group} className="mb-3">
                <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {DATE_GROUP_LABELS[group]}
                </p>
                {items.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={selectedId === conv.id}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onRename={onRename}
                  />
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  conversation: ChatConversation
  isActive: boolean
  onSelect: (id: string | null) => void
  onDelete: (id: string) => void
  onRename: (id: string, newTitle: string) => void
}) {
  const [editing, setEditing]     = React.useState(false)
  const [editValue, setEditValue] = React.useState("")
  const inputRef                  = React.useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setEditValue(conversation.title)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== conversation.title) {
      onRename(conversation.id, trimmed)
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); commitEdit() }
    if (e.key === "Escape") setEditing(false)
  }

  return (
    <div
      className={cn(
        "group relative flex w-full items-center rounded-lg transition-colors",
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
      )}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-sm outline-none"
        />
      ) : (
        <button
          type="button"
          className="flex-1 min-w-0 truncate px-2 py-1.5 text-left text-sm"
          onClick={() => onSelect(conversation.id)}
        >
          {conversation.title}
        </button>
      )}

      {!editing && (
        <div className="mr-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="size-6" />}
            >
              <MoreHorizontalIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem onClick={startEdit}>
                <PencilIcon className="size-3.5" />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(conversation.id)}
              >
                <Trash2Icon className="size-3.5" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
