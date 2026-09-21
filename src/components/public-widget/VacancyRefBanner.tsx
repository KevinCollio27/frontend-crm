import { BriefcaseBusinessIcon } from "lucide-react"

export function VacancyRefBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3.5 py-3">
      <BriefcaseBusinessIcon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Postulando a</p>
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
      </div>
    </div>
  )
}
