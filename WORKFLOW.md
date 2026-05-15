# Workflow: Conectar Secciones al Backend

Guía de proceso para incorporar cada sección nueva al CRM. Referencia: Contactos y Organizaciones.

---

## Proceso estándar por sección

### 1. Analizar el backend

Antes de tocar el frontend, entender qué existe en el backend:

- **Prisma schema** → qué campos tiene el modelo, tipos, relaciones
- **Endpoint principal** → ruta, método, params aceptados (`page`, `take`/`limit`, `filter`, etc.)
- **Estructura de respuesta** → ¿es `{ data, total, totalPages, ... }` o diferente? (campañas usa `{ campaigns, pagination }`)
- **Relaciones incluidas** → ¿viene `user`, `organization`, u otros objetos anidados?
- **Capacidades de filtrado** → ¿soporta `filter` (search)? ¿filtros por campo? ¿o solo paginación?

### 2. Determinar columnas

Regla: mostrar lo esencial, ocultar lo secundario. Referencia:

| Siempre visible         | Oculto por defecto            |
|------------------------|-------------------------------|
| `id`                   | campos técnicos (`workspace_id`, `user_id`) |
| nombre / título        | campos de auditoría redundantes |
| estado / tipo          | métricas secundarias          |
| métricas principales   | campos de relación (ej: `createdBy`) |
| fecha principal        |                               |

Columnas que **nunca** van: `workspace_id`, `user_id`, `is_deleted`, `updated_at`, `file_path`, `file_name`.

### 3. Crear los tipos (`src/types/<section>.ts`)

```ts
export interface SectionRaw {
  // snake_case tal cual viene del backend
}

export interface SectionPage {
  data: SectionRaw[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}
```

### 4. Crear el servicio (`src/services/<section>.service.ts`)

```ts
import api from "@/lib/api"
import type { SectionPage } from "@/types/section"

export interface SectionListParams {
  page?: number
  take?: number       // o "limit" según el endpoint
  filter?: string     // solo si el backend lo soporta
}

export const sectionService = {
  async list(params: SectionListParams = {}): Promise<SectionPage> {
    const res = await api.get<never, { items: SectionPage }>("endpoint", { params })
    return res.items
  },
}
```

Si la respuesta tiene estructura diferente (ej: `{ campaigns, pagination }`), normalizar dentro del servicio para que el componente siempre reciba `{ data, total, totalPages, page, pageSize }`.

### 5. Reescribir la tabla (`src/components/dashboard/<section>/SectionTable.tsx`)

Patrón estándar:

```
QueryState: { page, pageSize, search?, ...filtros_server }
useEffect: cancellable async fetch → setData + setTotal
mapSection: CampaignRaw → Campaign (camelCase)
manualPagination: true, rowCount: total
Skeleton: Array.from({ length: pageSize }) con animate-pulse
SimpleFilter: para filtros con opciones estáticas (si backend lo soporta)
DEFAULT_COLUMN_VISIBILITY: { campoOculto: false }
getSortIcon: importado de @/lib/table-utils
```

Reglas de código:
- Sin semicolons
- Sin `getFacetedRowModel` / `getFacetedUniqueValues` a menos que se necesiten counts
- Sin `getSortIcon` local — usar el de `@/lib/table-utils`
- `export interface NombreEntity` al inicio (lo usa el PreviewSheet)
- `columns` no se exporta (solo el componente lo usa)
- `columnLabels` record para el dropdown de visibilidad

---

## Secciones implementadas

| Sección       | Endpoint                  | Search | Filtros server | Estado   |
|---------------|---------------------------|--------|---------------|----------|
| Contactos     | `GET /contact`            | ✅ `filter` | —         | Conectado |
| Organizaciones| `GET /organization`       | ✅ `filter` | —         | Conectado |
| Documentos    | `GET /workspace-document` | ✅ `filter` | `category`, `visibility` | Conectado |
| Campañas      | `GET /marketing/campaigns`| ❌     | ❌ (solo page+limit) | Conectado |
| Formularios   | `GET /widget-forms`       | ✅ `filter` | `is_active`    | Conectado |
| Widget AI     | `GET /ai/widgets`         | ✅ `filter` | `is_active`, `is_whatsapp_agent` | Conectado |
| Blogs         | `GET /blog`               | ✅ `filter` | `is_active`    | Conectado |

---

## Secciones pendientes

- Listas de marketing (`/marketing/lists` o similar)
- **Nota Blogs:** El endpoint workspace-level `GET /blog/posts` fue creado en esta sesión (no existía antes). El repositorio usa `prisma` directo (no BaseRepository) porque el modelo `blog` no extiende de él.
- Contactos de campaña
- Canales (email, WhatsApp)
- Pipelines / Oportunidades
- Tareas / Actividades

---

## Notas de convención

- Si el backend usa `limit` en vez de `take`, el servicio recibe `limit` y el param se envía tal cual.
- Si no hay search/filter server-side, no agregar input de búsqueda (filtraría solo la página actual — confuso).
- Si los filtros solo son client-side: documentarlo aquí y evitarlo en el componente hasta que el backend lo soporte.
- `SimpleFilter` se define localmente en la tabla hasta que se cree como componente compartido en `src/components/ui/`.
