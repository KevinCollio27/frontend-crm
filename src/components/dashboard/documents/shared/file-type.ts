import type { ElementType } from "react"
import { Link2 } from "lucide-react"
import {
  FaRegFile,
  FaRegFileExcel,
  FaRegFileImage,
  FaRegFilePdf,
  FaRegFilePowerpoint,
  FaRegFileWord,
  FaRegFileZipper,
} from "react-icons/fa6"

// Fuente única — DocumentsTable.tsx y DocumentPreviewSheet.tsx antes tenían
// cada uno su propia copia (la de Preview ni siquiera tenía dark:, y ninguna
// cubría webp, que sí aparece en datos reales).
export const FILE_TYPE_CONFIG: Record<string, { icon: ElementType; iconClass: string; bgClass: string }> = {
  pdf:  { icon: FaRegFilePdf,        iconClass: "text-red-600 dark:text-red-400",       bgClass: "bg-red-50 dark:bg-red-950/40"       },
  png:  { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",     bgClass: "bg-blue-50 dark:bg-blue-950/40"     },
  jpg:  { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",     bgClass: "bg-blue-50 dark:bg-blue-950/40"     },
  jpeg: { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",     bgClass: "bg-blue-50 dark:bg-blue-950/40"     },
  webp: { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",     bgClass: "bg-blue-50 dark:bg-blue-950/40"     },
  svg:  { icon: FaRegFileImage,      iconClass: "text-blue-600 dark:text-blue-400",     bgClass: "bg-blue-50 dark:bg-blue-950/40"     },
  docx: { icon: FaRegFileWord,       iconClass: "text-sky-600 dark:text-sky-400",       bgClass: "bg-sky-50 dark:bg-sky-950/40"       },
  doc:  { icon: FaRegFileWord,       iconClass: "text-sky-600 dark:text-sky-400",       bgClass: "bg-sky-50 dark:bg-sky-950/40"       },
  xlsx: { icon: FaRegFileExcel,      iconClass: "text-green-600 dark:text-green-400",   bgClass: "bg-green-50 dark:bg-green-950/40"   },
  xls:  { icon: FaRegFileExcel,      iconClass: "text-green-600 dark:text-green-400",   bgClass: "bg-green-50 dark:bg-green-950/40"   },
  pptx: { icon: FaRegFilePowerpoint, iconClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-50 dark:bg-orange-950/40" },
  ppt:  { icon: FaRegFilePowerpoint, iconClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-50 dark:bg-orange-950/40" },
  zip:  { icon: FaRegFileZipper,     iconClass: "text-yellow-600 dark:text-yellow-400", bgClass: "bg-yellow-50 dark:bg-yellow-950/40" },
  rar:  { icon: FaRegFileZipper,     iconClass: "text-yellow-600 dark:text-yellow-400", bgClass: "bg-yellow-50 dark:bg-yellow-950/40" },
  link: { icon: Link2,               iconClass: "text-violet-600 dark:text-violet-400", bgClass: "bg-violet-50 dark:bg-violet-950/40" },
}

export const DEFAULT_FILE_TYPE_CONFIG = { icon: FaRegFile, iconClass: "text-muted-foreground", bgClass: "bg-muted" }
