# Patrón de sheets "Crear X"

Referencia de cómo se estructuran los formularios de creación/edición (`Create*Sheet.tsx`)
a partir del rediseño de Contactos y Organizaciones. Aplicar esto mismo al resto de sheets
simples que todavía usan el formato viejo (ver checklist al final).

No aplica a los sheets tipo "builder" con panel de preview en vivo (Formularios, Campañas,
Cotizaciones, Widget IA, Plantillas PDF — todos a 1400px). Esos son otra categoría de UI.

## 1. Analizar antes de diseñar

Antes de tocar el JSX, medir en prod qué campos se usan realmente. Los formularios se arman
históricamente por lo que el modelo de datos permite, no por lo que la gente llena.

```sql
-- % de registros con cada campo lleno, sobre el total activo
select
  count(*) filter (where campo is not null and campo <> '') as con_dato,
  count(*) as total
from sch_core.<tabla>
where is_deleted = false;

-- para campos EAV (person_detail / organization_detail — email, teléfono, cargo, dirección…)
select l.key, count(distinct pd.<entidad>_id) as con_valor
from sch_core.<entidad>_detail pd
join sch_core.label l on l.id = pd.label_id
join sch_core.<entidad> p on p.id = pd.<entidad>_id and p.is_deleted = false
where pd.value is not null and pd.value <> ''  -- ojo: algunos campos (cargo, tag) guardan
                                                 -- el dato real en `option`, no en `value`
group by l.key;
```

Con eso se separan los campos en dos grupos:

- **Núcleo** (≳40-50%+ de uso): siempre visibles.
- **Ruido** (\<5% de uso): ocultos por defecto, detrás de un colapsable.

### Resultados ya medidos

| Entidad | Campo | % uso | Grupo |
|---|---|---|---|
| Contacto (23,104 activos) | Correo | 98.4% | Núcleo |
| | Fuente de Contacto | 92.5% | Núcleo |
| | Organización | 90.0% | Núcleo |
| | Teléfono | 89.4% | Núcleo |
| | Cargo | 0.7% | Adicional |
| | Cargo Interno | 0.4% | Adicional |
| | Redes Sociales | 2.3% | Adicional |
| | Fecha de Nacimiento | 0.2% | Adicional |
| Organización (22,999 activas) | Dirección | 57.6% | Núcleo |
| | RUT / ID Fiscal | 47.2% | Núcleo |
| | Industria | 2.0% | Adicional |
| | Página Web | 0.9% | Adicional |
| | Redes Sociales | 0.4% | Adicional |
| Oportunidad (2,382 activas) | Contacto CRM | 99.96% | Núcleo |
| | Organización | 18.9% | Núcleo (ver excepción abajo) |
| | Ingreso Estimado | 6.8% | Adicional |
| | Responsable de Negocio | 6.0% | Adicional |
| | Prioridad | 5.5% | Adicional |
| | Fecha Prevista de Cierre | 4.6% | Adicional |
| | Descripción / Notas | 3.1% | Adicional |

### Excepción a la regla: campos acoplados

El % de uso no es la única señal — si dos campos están **acoplados en el flujo** (elegir uno
autocompleta el otro), van juntos en el núcleo aunque uno de los dos casi no se llene por su
cuenta. Caso real: en Oportunidad, `handleContactChange` autocompleta la Organización cuando el
contacto elegido ya tiene una asociada — por eso Organización se quedó en "Información de la
Oportunidad" junto a Contacto (18.9% de uso real, pero ahí es donde ocurre el autocompletado),
no escondida en el colapsable. Antes de mover un campo a "ruido" solo por su %, revisar si algún
`handleXChange` lo toca.

Antes de rediseñar cualquier sheet nuevo, también vale la pena mirar si existe una versión vieja
del CRM (`goxt-frontend-crm` en este caso) — no para copiar el diseño, pero sí para pescar
validaciones o reglas de negocio no obvias que el código actual heredó o dejó caer (ej.: se
confirmó ahí que la moneda por defecto de una Oportunidad sigue al workspace con fallback a CLP,
no a un campo país — y que el código actual ya implementa eso bien, no hacía falta tocarlo).

### Excepción a la regla: cuando no hay ruido que esconder

No todas las entidades tienen campos de bajo uso — Actividad es el caso: de 239 actividades
activas, ligar a Oportunidad (99.2%), Fecha Desde/Hasta (100%/100%) y Tipo (100%) se usan casi
siempre, y Prioridad (90.8%) está inflado por un valor medio que se autoselecciona al crear (no
es intención real del usuario, pero igual queda casi siempre presente). El único dato realmente
bajo es el modo "Google Calendar Sync" (1.7% de adopción) — pero ese ya estaba bien resuelto en
el código: no es un campo, es un modo completo que cambia validaciones, y solo aparece detrás de
un toggle explícito (arranca en "Actividad Normal"). No todo colapsable — cuando el toggle/modo ya
oculta algo por diseño, no hace falta envolverlo en `CollapsibleSection` también.
En ese caso el rediseño fue puramente de tamaño/estructura (720px + `Section`), sin
`CollapsibleSection` — no forzar el patrón completo si los datos no lo piden.

## 2. Estructura visual

- **Ancho del Sheet:** `720px` (`style={{ maxWidth: 720, padding: 0, gap: 0 }}`). Es el tamaño
  de "Nuevo Post", con espacio real para 2 columnas sin sentirse apretado. Nada de 500px.
- **Cada sección núcleo** va en `<Section title="…" description="…" icon={IconoLucide}>`
  (`@/components/ui/section`) — caja con borde redondeado, header con ícono **y subtítulo**,
  siempre visible. El `description` no es opcional por estética: así se ve en Campañas,
  Formularios, Cotizaciones y Widget IA — si un `Section` nuevo queda solo con `title` + `icon`
  sin `description`, desentona con el resto de la app (pasó en la primera versión de
  Contacto/Organización/Oportunidad, se corrigió después).
- **Los campos de ruido** van todos juntos en un único `<CollapsibleSection title="Información Adicional" description="…" icon={…} defaultOpen={hasAdditionalData}>`
  (`@/components/ui/collapsible-section`) — colapsado por defecto. `hasAdditionalData` se
  calcula antes del `return` chequeando si alguno de esos campos ya trae valor (modo edición),
  para que no queden datos guardados escondidos:

  ```tsx
  const hasAdditionalData = !!(role || internalRole || birthDate || socials.some((s) => s.value.trim()))
  ```

- El `<form>` que envuelve todo lleva `className="space-y-5 p-5"` en vez de que cada bloque
  tenga su propio `p-5` — el `Section`/`CollapsibleSection` ya trae su propio padding interno.
- Se elimina `<Separator />` entre bloques — el borde de cada `Section` ya separa visualmente.
- Listas de 1 sola fila por entrada (Correo, Teléfono, Direcciones, Redes Sociales) van **cada
  una en su propia fila completa**, no una al lado de la otra — probado que lado a lado
  (`grid-cols-2`) se ve apretado con los selects + input + botón que llevan adentro.

## 3. Interacciones

- Botón "+ Añadir X" de listas repetibles: `variant="outline" size="sm" className="w-fit"`
  (nunca `w-full` — se ve gigante a 720px).
- Botón de quitar una fila de la lista: ícono `Trash2Icon` (no `XIcon`), con
  `className="shrink-0 text-muted-foreground hover:text-destructive"` — se pone rojo al pasar
  el mouse. Mismo patrón que las opciones de etiqueta en Producto.
- Footer: solo `Cancelar` / `Guardar`. El botón queda como `{breadcrumb ? "Anterior" : "Cancelar"}`
  únicamente cuando el sheet se abre desde otro flujo todavía montado detrás (ej. crear
  contacto desde dentro de una cotización) — eso no es un wizard interno, no confundir con el
  "Anterior" de un stepper de pasos.

## 4. Checklist de sheets

⚠️ **Ojo con duplicados**: antes de dar por migrada una entidad, buscar si el sub-flujo de
"crear rápido desde otro sheet" y la sección propia de esa entidad usan el **mismo** componente
o dos distintos que fueron divergiendo con el tiempo (uno sin modo edición, por ejemplo):
`grep -rln "Crear <Entidad>\|<Entidad>Sheet" src/components --include="*.tsx"`.

Ya se revisó esto para: Contacto, Actividad, Producto, Blog, Embudo (Funnel) y Oportunidad —
todas usan un único componente `Create<Entidad>Sheet.tsx` con un `id` opcional (sin id = crear,
con id = editar), reusado tanto en su sección propia como en cualquier sub-flujo. Ese es el
patrón correcto a replicar.

**Organización tenía el problema** (`CreateOrganizationSheet.tsx` solo creaba,
`OrganizationSheet.tsx` aparte creaba y editaba, para la sección Organizaciones) y ya se
consolidó: `OrganizationSheet.tsx` se eliminó, `CreateOrganizationSheet.tsx` ahora soporta
`organizationId?: number` (mismo patrón que `CreateContactSheet`) y es el único componente,
usado por `OrganizationsTable.tsx`, `OrganizationDetail.tsx`, `CreateContactSheet.tsx` y
`CreateOpportunitySheet.tsx`.

No todos los sheets siguen el prefijo `Create` — Documentos usa `UploadDocumentSheet.tsx`. Al
buscar duplicados de una entidad nueva, no asumir el nombre del archivo por convención; usar
`Glob "**/*Sheet.tsx"` o buscar por el texto del botón ("Subir Documento", "Nueva Actividad") si
el grep por `Create<Entidad>Sheet` no encuentra nada.

| Sheet | Ancho actual | Estado |
|---|---|---|
| `contacts/CreateContactSheet.tsx` | 720 | ✅ Migrado |
| `organizations/CreateOrganizationSheet.tsx` (único, crea+edita) | 720 | ✅ Migrado y consolidado |
| `funnels/CreateOpportunitySheet.tsx` | 720 | ✅ Migrado |
| `activities/CreateActivitySheet.tsx` | 720 | ✅ Migrado (sin `CollapsibleSection` — no tenía ruido real, ver excepción arriba) |
| `documents/UploadDocumentSheet.tsx` | 720 | ✅ Migrado (sin `CollapsibleSection` — categoría 77%, visibilidad 100%, nada bajo el 10%) |
| `blogs/CreateBlogSheet.tsx` | 720 | ✅ Migrado (sin `CollapsibleSection` — config de sitio, todo lo expuesto se usa; `logo_url`/`allowed_domains` existen en el schema pero ni siquiera están en el formulario) |
| `settings/funnels/CreateFunnelSheet.tsx` (wizard 2 pasos) | 720 | ✅ Migrado (ya usaba `Section` en los 2 pasos — solo era ancho) |
| `settings/products/CreateProductSheet.tsx` (wizard 2 pasos) | 720 | ✅ Migrado (paso 2 ya usaba `Section`, se le agregó al paso 1 que no lo tenía) |
| `blogs/CreatePostSheet.tsx` | 720 | ✅ Migrado (solo diseño — el ancho ya estaba correcto) |
| `campains/CreateCampaignSheet.tsx` | 1400 | Fuera de alcance (builder) |
| `forms/CreateFormSheet.tsx` | 1400 | Fuera de alcance (builder) |
| `quotations/CreateQuotationSheet.tsx` | 1400 | Fuera de alcance (builder) |
| `widget-ai/CreateWidgetSheet.tsx` | 1400 | Fuera de alcance (builder) |
| `settings/pdf-templates/CreatePdfTemplateSheet.tsx` | 1400 | Fuera de alcance (builder) |
| `settings/pdf-templates/EditBlockSheet.tsx` (sub-sheet del builder de Plantillas, "crear/editar bloque") | 720 | ✅ Migrado (era 600px, sin `Section`) |

⚠️ Un sheet marcado "Fuera de alcance (builder)" puede tener sub-sheets propios que sí aplican
— `EditBlockSheet` vive dentro del builder de Plantillas PDF pero es un formulario chico e
independiente (se abre encima, no es parte del canvas de 1400px). Revisar con
`Glob "**/*Sheet.tsx"` dentro de la carpeta de cada builder antes de darlo por descartado entero.

Antes de migrar cada uno: correr el análisis de la sección 1 sobre su tabla/EAV correspondiente
— no asumir qué campos son "de ruido" solo por intuición.
