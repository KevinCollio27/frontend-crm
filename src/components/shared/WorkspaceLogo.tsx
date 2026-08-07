// La mayoría de los logos reales son tipo "wordmark" (anchos, no cuadrados) —
// una caja cuadrada los deja con harto espacio blanco a los costados por el
// object-contain, y se ven chicos aunque la caja no lo sea. Por eso sm/md son
// rectangulares (más ancho que alto), no cuadrados como antes.
const SIZE_CLASSES = {
  sm: { box: "h-7 w-9", pad: "" },
  md: { box: "h-9 w-11", pad: "" },
  lg: { box: "size-24", pad: "p-3" },
}

interface WorkspaceLogoProps {
  name: string
  logo?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

export function WorkspaceLogo({ name, logo, size = "md", className }: WorkspaceLogoProps) {
  const { box, pad } = SIZE_CLASSES[size]
  // Sin logo propio subido: en vez de mostrar solo la inicial, se usa el logo de
  // GOXT como base — mismo casillero blanco que un logo real, así queda prolijo
  // y consistente en vez de una letra suelta.
  const src = logo || "/images/goxt-negro.png"
  return (
    <div className={`${box} ${className ?? ""} ${pad} shrink-0 flex items-center justify-center rounded-lg bg-white`}>
      <img src={src} alt={name} className="size-full object-contain" />
    </div>
  )
}
