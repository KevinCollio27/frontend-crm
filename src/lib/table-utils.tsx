import { ArrowDownIcon, ArrowUpDown, ArrowUpIcon } from "lucide-react"

export const getFlag = (code: string) =>
  code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("")

export const getSortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return <ArrowUpIcon className="ml-2 size-3.5" />
  if (sorted === "desc") return <ArrowDownIcon className="ml-2 size-3.5" />
  return <ArrowUpDown className="ml-2 size-3.5" />
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}
