interface SectionProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  actions?: React.ReactNode
  children: React.ReactNode
}

export function Section({ title, description, icon: Icon, actions, children }: SectionProps) {
  return (
    <section className="rounded-xl border bg-background p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
