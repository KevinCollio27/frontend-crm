import { BASE_ENTITY_FIELDS, ENTITY_ORDER, type EntityKey } from "./entity-fields"

export interface BaseFieldBlockData {
  entity: EntityKey
  key: string
  required: boolean
  label: string
  placeholder: string
}

export interface HeadingBlockData {
  text: string
  level: 1 | 2 | 3
}

export interface ParagraphBlockData {
  text: string
}

export interface ImageBlockData {
  src: string
  srcKey: string
  alt: string
}

export type DividerBlockData = Record<string, never>

export interface SpacerBlockData {
  height: number
}

export interface SectionTitleBlockData {
  text: string
  color: string
}

export type NoticeVariant = "info" | "warning" | "success" | "neutral"

export interface NoticeBlockData {
  variant: NoticeVariant
  title: string
  text: string
}

export type DynamicFieldType =
  | "shortText"
  | "longText"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "radio"
  | "url"
  | "checkbox"
  | "file"

export const CHOICE_FIELD_TYPES: DynamicFieldType[] = ["select", "multiselect", "radio"]

export type FileAccept = "image" | "document" | "video" | "any"

export const FILE_ACCEPT_LABEL: Record<FileAccept, string> = {
  image: "Imagen",
  document: "Documento",
  video: "Video",
  any: "Cualquiera",
}

export interface FieldBlockData {
  fieldType: DynamicFieldType
  label: string
  placeholder: string
  helper: string
  required: boolean
  width: "full" | "half"
  options: string[]
  allowOther: boolean
  accept: FileAccept
}

export type FormBlock =
  | { id: string; type: "base_field"; data: BaseFieldBlockData }
  | { id: string; type: "heading"; data: HeadingBlockData }
  | { id: string; type: "paragraph"; data: ParagraphBlockData }
  | { id: string; type: "image"; data: ImageBlockData }
  | { id: string; type: "divider"; data: DividerBlockData }
  | { id: string; type: "spacer"; data: SpacerBlockData }
  | { id: string; type: "sectionTitle"; data: SectionTitleBlockData }
  | { id: string; type: "notice"; data: NoticeBlockData }
  | { id: string; type: "field"; data: FieldBlockData }

export type FormBlockType = FormBlock["type"]
export type LayoutBlockType = "heading" | "paragraph" | "image" | "divider" | "spacer" | "sectionTitle" | "notice"

const DYNAMIC_FIELD_LABEL: Record<DynamicFieldType, string> = {
  shortText: "Pregunta corta",
  longText: "Pregunta larga",
  email: "Correo electrónico",
  phone: "Teléfono",
  number: "Número",
  date: "Fecha",
  select: "Elige una opción",
  multiselect: "Elige varias opciones",
  radio: "Elige una",
  url: "Sitio web",
  checkbox: "Confirmar",
  file: "Adjunta un archivo",
}

export function baseFieldBlock(
  entity: EntityKey,
  key: string,
  required: boolean,
  placeholderOverride?: string,
  labelOverride?: string
): FormBlock {
  const def = BASE_ENTITY_FIELDS[entity].find((d) => d.key === key)
  const placeholder = placeholderOverride ?? def?.placeholder ?? ""
  const label = labelOverride ?? def?.label ?? ""
  return { id: crypto.randomUUID(), type: "base_field", data: { entity, key, required, label, placeholder } }
}

/** Una entidad se considera activa (se crea al enviar el formulario) si tiene al menos un campo en el lienzo. */
export function activeEntitiesFromBlocks(blocks: FormBlock[]): EntityKey[] {
  const present = new Set<EntityKey>()
  for (const b of blocks) {
    if (b.type === "base_field") present.add(b.data.entity)
  }
  return ENTITY_ORDER.filter((e) => present.has(e))
}

export function emptyFieldBlock(fieldType: DynamicFieldType): FormBlock {
  return {
    id: crypto.randomUUID(),
    type: "field",
    data: {
      fieldType,
      label: DYNAMIC_FIELD_LABEL[fieldType],
      placeholder: "",
      helper: "",
      required: false,
      width: "full",
      options: CHOICE_FIELD_TYPES.includes(fieldType) ? ["Opción 1", "Opción 2", "Opción 3"] : [],
      allowOther: false,
      accept: "any",
    },
  }
}

export function emptyLayoutBlock(type: LayoutBlockType): FormBlock {
  const id = crypto.randomUUID()
  switch (type) {
    case "heading":
      return { id, type, data: { text: "Encabezado", level: 2 } }
    case "paragraph":
      return { id, type, data: { text: "Escribe una descripción breve..." } }
    case "image":
      return { id, type, data: { src: "", srcKey: "", alt: "" } }
    case "divider":
      return { id, type, data: {} }
    case "spacer":
      return { id, type, data: { height: 24 } }
    case "sectionTitle":
      return { id, type, data: { text: "Titulo de Seccion", color: "#6b7280" } }
    case "notice":
      return {
        id,
        type,
        data: {
          variant: "info",
          title: "Aviso",
          text: "Tus datos están protegidos y no se compartirán con terceros.",
        },
      }
  }
}
