export type EntityKey = "contacto" | "organizacion" | "oportunidad"

export const ENTITY_ORDER: EntityKey[] = ["contacto", "organizacion", "oportunidad"]

export const ENTITY_LABELS: Record<EntityKey, string> = {
  contacto: "Contacto",
  organizacion: "Organización",
  oportunidad: "Oportunidad",
}

export interface BaseFieldDef {
  key: string
  label: string
  type: string
  group: string
  /** Siempre activo y obligatorio, no se puede desactivar. */
  core?: boolean
  /** Si está activa la entidad indicada, este campo no se muestra (se vincula automáticamente). */
  hiddenIfEntityActive?: EntityKey
  /** Placeholder por defecto al insertar el campo en el lienzo — editable luego en Propiedades. */
  placeholder?: string
}

export const BASE_ENTITY_FIELDS: Record<EntityKey, BaseFieldDef[]> = {
  contacto: [
    { key: "name", label: "Nombre Completo", type: "Texto", group: "Perfil General", core: true, placeholder: "Ingresa el nombre completo" },
    { key: "organization", label: "Organización", type: "Selector", group: "Perfil General", placeholder: "Selecciona una organización" },
    { key: "country", label: "País de Origen", type: "Selector buscable", group: "Perfil General", placeholder: "Selecciona tu país" },
    { key: "source", label: "Fuente de Contacto", type: "Selector", group: "Perfil General", placeholder: "¿Cómo llegaste hasta nosotros?" },
    { key: "emails", label: "Correo", type: "Lista repetible", group: "Canales de Comunicación", placeholder: "correo@ejemplo.com" },
    { key: "phones", label: "Teléfono", type: "Lista repetible", group: "Canales de Comunicación", placeholder: "+56 9 1234 5678" },
    { key: "role", label: "Cargo", type: "Selector", group: "Información Profesional", placeholder: "Selecciona un cargo" },
    { key: "internalRole", label: "Cargo Interno", type: "Texto", group: "Información Profesional", placeholder: "Ej. Jefe de planta A" },
    { key: "birthDate", label: "Fecha de Nacimiento", type: "Fecha", group: "Información Profesional" },
    { key: "socials", label: "Redes Sociales", type: "Lista repetible", group: "Información Profesional", placeholder: "Usuario o URL del perfil" },
  ],
  organizacion: [
    { key: "name", label: "Nombre de la Organización", type: "Texto", group: "Perfil General", core: true, placeholder: "Ingresa el nombre de la organización" },
    { key: "country", label: "País de Origen", type: "Selector buscable", group: "Perfil General", placeholder: "Selecciona el país" },
    { key: "taxId", label: "ID Fiscal / RUT", type: "Texto", group: "Perfil General", placeholder: "Ej. 76.123.456-7" },
    { key: "industry", label: "Industria", type: "Texto", group: "Perfil General", placeholder: "Ej. Tecnología de la Información" },
    { key: "address", label: "Dirección", type: "Texto", group: "Perfil General", placeholder: "Calle 123, Of. 45" },
    { key: "website", label: "Página Web", type: "URL", group: "Presencia Digital", placeholder: "https://ejemplo.com" },
    { key: "socials", label: "Redes Sociales", type: "Lista repetible", group: "Presencia Digital", placeholder: "Usuario o URL del perfil" },
  ],
  oportunidad: [
    { key: "name", label: "Nombre de la Oportunidad", type: "Texto", group: "Información de la Oportunidad", core: true, placeholder: "Ingresa el nombre de la oportunidad" },
    { key: "stage", label: "Etapa de Negocio", type: "Selector", group: "Información de la Oportunidad", placeholder: "Selecciona una etapa" },
    { key: "amount", label: "Ingreso Estimado", type: "Moneda", group: "Información de la Oportunidad", placeholder: "0" },
    { key: "contact", label: "Contacto CRM", type: "Selector", group: "Información de la Oportunidad", hiddenIfEntityActive: "contacto", placeholder: "Selecciona un contacto" },
    { key: "organization", label: "Organización / Empresa", type: "Selector", group: "Información de la Oportunidad", hiddenIfEntityActive: "organizacion", placeholder: "Selecciona una organización" },
    { key: "priority", label: "Prioridad", type: "Segmentado", group: "Información de la Oportunidad" },
    { key: "description", label: "Descripción / Notas Comerciales", type: "Texto largo", group: "Información de la Oportunidad", placeholder: "Describe la oportunidad, necesidades del cliente, etc." },
    { key: "responsible", label: "Responsable de Negocio", type: "Selector", group: "Gestión", placeholder: "Selecciona un responsable" },
    { key: "closeDate", label: "Fecha Prevista de Cierre", type: "Fecha", group: "Gestión" },
  ],
}
