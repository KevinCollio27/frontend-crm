"use client"

import * as React from "react"
import { MailIcon } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { MailNav } from "@/components/dashboard/mail/MailNav"
import { MailList } from "@/components/dashboard/mail/MailList"
import { MailDisplay } from "@/components/dashboard/mail/MailDisplay"
import { mails } from "@/components/dashboard/mail/data"
import type { Folder } from "@/components/dashboard/mail/data"

export default function MailPage() {
  const [activeFolder, setActiveFolder] = React.useState<Folder>("inbox")
  const [selectedMailId, setSelectedMailId] = React.useState<string | null>(
    mails[0]?.id ?? null
  )

  return (
    <>
      <PageHeader
        icon={MailIcon}
        title="Correo"
        description="Bandeja de entrada del workspace"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Columna 1 — carpetas */}
        <div className="flex w-52 shrink-0 flex-col overflow-hidden border-r">
          <MailNav activeFolder={activeFolder} onFolderChange={setActiveFolder} />
        </div>

        {/* Columna 2 — lista (único scroll) */}
        <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r">
          <MailList
            folder={activeFolder}
            mails={mails}
            selectedId={selectedMailId}
            onSelect={setSelectedMailId}
          />
        </div>

        {/* Columna 3 — vista previa */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <MailDisplay mail={mails.find((m) => m.id === selectedMailId)} />
        </div>
      </div>
    </>
  )
}
