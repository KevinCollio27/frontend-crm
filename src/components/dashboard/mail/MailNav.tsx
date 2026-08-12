import {
  ArchiveIcon,
  InboxIcon,
  SendIcon,
  ShieldAlertIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Folder } from "./data"

export interface FolderItem {
  id: Folder
  label: string
  icon: React.ElementType
  count?: number
}

// Exportado — el selector de carpeta en mobile (page.tsx) reusa esta misma lista
// en vez de mantener una copia aparte.
export const folders: FolderItem[] = [
  { id: "inbox", label: "Recibidos", icon: InboxIcon, count: 128 },
  { id: "sent", label: "Enviado", icon: SendIcon },
  { id: "junk", label: "Correo no deseado", icon: ShieldAlertIcon, count: 23 },
  { id: "trash", label: "Eliminados", icon: Trash2Icon },
  { id: "archive", label: "Archivo", icon: ArchiveIcon },
]

interface MailNavProps {
  activeFolder: Folder
  onFolderChange: (folder: Folder) => void
}

export function MailNav({ activeFolder, onFolderChange }: MailNavProps) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {folders.map((folder) => {
        const Icon = folder.icon
        const active = activeFolder === folder.id
        return (
          <button
            key={folder.id}
            type="button"
            onClick={() => onFolderChange(folder.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 text-left">{folder.label}</span>
            {folder.count !== undefined && (
              <span
                className={cn(
                  "ml-auto text-xs tabular-nums",
                  active ? "text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {folder.count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
