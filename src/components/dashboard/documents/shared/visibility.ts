// Fuente única — DocumentsTable.tsx y DocumentPreviewSheet.tsx (2 veces) antes
// repetían "bg-emerald-50 text-emerald-600" sin dark: cada uno por su lado.
export const VISIBILITY_CONFIG: Record<string, { label: string; className: string }> = {
  public: {
    label: "Público",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  private: {
    label: "Privado",
    className: "bg-muted text-muted-foreground border-border",
  },
}
