# Responsividad — proceso y patrón de referencia

## Principio

Todo ajuste es **solo para mobile**, vía el breakpoint `md` (768px) que ya usa `useIsMobile()` (`src/hooks/use-mobile.ts`). El layout de escritorio (`md` en adelante) no se toca — cero cambios visuales ahí en ninguno de los pasos de abajo.

Preferimos clases responsive de Tailwind (`md:...`) por sobre el hook de JS cuando el cambio es puramente de layout/CSS (evita flash de contenido y no depende de un render extra). El hook `useIsMobile()` solo se usa cuando el cambio depende de **estado** (ej. qué columnas de la tabla vienen visibles por defecto).

**Referencia validada:** Contactos (`ContactsTable.tsx`) fue el primer caso, se iteró varias veces hasta quedar bien. Organizaciones (`OrganizationsTable.tsx`) es la segunda aplicación del mismo patrón, ya más directa. Para el resto de las tablas, copiar la estructura de estos dos.

## El patrón, pieza por pieza

### 1. Toolbar (fila de filtros y acciones)

Problema original: todo en un solo `flex` sin wrap → scroll horizontal.

Estructura resultante:

```
[🔍 Buscar...                    ]   ← full width en mobile, w-44 en desktop
──────────────────────────────────   ← separador (border-b), solo visible en mobile
[filtro 1] [filtro 2]                ← grid de 2 columnas si son 2 filtros,
                                         o el filtro ocupa el 100% si es solo 1
[Restablecer]                        ← fila propia (col-span-2), solo si hay filtro activo
──────────────────────────────────
N registros                          ← su propia línea (w-full en mobile, w-auto en desktop)
┌──────────────┬──────────────┐
│  Columnas ▾  │   ··· Más    │      ← grid de 2 columnas
└──────────────┴──────────────┘
```

- **Columnas** queda siempre visible como botón propio (es la acción más usada).
- El resto de acciones (Fusionar duplicados, Importar/Exportar, Importar con Google si aplica) se agrupan en un menú **"··· Más"** en mobile — pero **sin mezclar los checkboxes de Columnas ahí adentro** (probamos eso primero, no funcionó visualmente, ver `DropdownMenuLabel` + checkboxes por separado).
- En desktop esas mismas acciones vuelven a ser botones sueltos (`hidden md:flex`), igual que siempre.
- Los filtros/select que renderizan un `<Button>` internamente (no aceptan `className`) se estiran con el truco `[&_button]:w-full md:[&_button]:w-auto` en un `<div>` envolvente — sin tocar el componente compartido.

⚠️ **Bug de base-ui:** `DropdownMenuLabel` tiene que ir dentro de `DropdownMenuGroup`, si no truena en runtime (`MenuGroupRootContext is missing`). Ya nos pasó dos veces.

⚠️ **Con un número de filtros impar (3, o variable como en Actividades), el grid de 2 columnas deja un hueco** — el último filtro queda solo, ocupando la mitad izquierda de su fila. Dos soluciones probadas, en orden de preferencia:

1. **(Preferida) "Restablecer" como ítem normal del grid, no como fila propia.** El grid sigue siendo `grid grid-cols-2` para filtros + Restablecer juntos — sin `col-span-2` en Restablecer. Como Restablecer solo aparece cuando hay algún filtro activo, en la práctica siempre "rellena" el hueco del filtro impar (ej. 3 filtros + Restablecer = 4 ítems = 2 filas parejas). Aplicado en Actividades y Cotizaciones.
2. **Apilar uno por fila** (`flex flex-col md:flex-row md:flex-wrap`) — más robusto ante cualquier cantidad (nunca queda hueco, ni siquiera sin Restablecer), pero ocupa más alto. Se probó primero en Actividades y se descartó a favor de la opción 1 porque se veía "raro" tener todo apilado cuando el grid de 2 sí calzaba la mayoría de las veces.

El grid de 2 columnas fijo (sin Restablecer de por medio) sigue siendo la base para casos con número de ítems realmente fijo y par (como la fila de Columnas/Más, que siempre son exactamente 2).

### 2. Tabla — columnas visibles en mobile

Cada tabla ya tenía un `DEFAULT_COLUMN_VISIBILITY` (oculta algunas columnas siempre, en cualquier pantalla). Se agrega un segundo objeto solo para mobile:

```ts
const MOBILE_COLUMN_VISIBILITY: VisibilityState = {
  id: false,
  // ...todas las columnas menos "name"
}
```

Y en el componente:

```ts
const isMobile = useIsMobile()
React.useEffect(() => {
  if (isMobile) setColumnVisibility(MOBILE_COLUMN_VISIBILITY)
}, [isMobile])
```

El checkbox de selección y la columna "Acciones" (el "···" por fila) tienen `enableHiding: false` en la definición de columnas — nunca dependen de esto, siempre se ven, no hace falta tocarlos.

El usuario puede reactivar cualquier columna manualmente desde "Columnas" — este default no es destructivo.

### 3. Paginación (footer de la tabla)

Ya arreglado a nivel de **componente compartido** (`src/components/ui/data-table-pagination.tsx`) — beneficia a todas las tablas de una sola vez, no hay que repetirlo por tabla:

- El texto "X de Y fila(s) seleccionada(s)" se oculta en mobile (`hidden md:block`).
- La etiqueta "Filas por página" se oculta en mobile, queda solo el selector.
- "Página X de Y" ya no fuerza un ancho fijo en mobile.
- Sin `flex-wrap` — todo cabe en una sola fila achicando paddings/anchos.

### 4. Sheets (paneles laterales)

**Bug de base encontrado:** el componente `Sheet` (`src/components/ui/sheet.tsx`) trae por defecto `data-[side=right]:w-3/4` (75% del ancho). Cada sheet individual intenta anularlo con `className="w-full"`, pero por especificidad CSS (el selector combinado clase+atributo le gana a la clase suelta), **el 75% base siempre gana** — el `w-full` nunca hacía efecto. Esto probablemente afecta a los ~59 sheets del proyecto, no solo a los que ya tocamos.

**Fix aplicado (por sheet, no a nivel base todavía):** cambiar `className="w-full"` por `className="w-full!"` (sintaxis de `!important` de Tailwind v4 — el `!` va al final, no al principio). Esto gana pase lo que pase con la especificidad, sin tocar el componente compartido ni arriesgar los sheets que no hemos revisado.

Sheets ya arreglados así: `CreateContactSheet`, `DuplicateContactsSheet`, `MergeContactsSheet`, `ContactsImportExportSheet`, `CreateOrganizationSheet`, `DuplicateOrganizationsSheet`, `MergeOrganizationsSheet`, `OrganizationsImportExportSheet`, `CreateActivitySheet`, `ActivityPreviewSheet`.

**Variante del mismo bug — sheets de "preview" (al hacer clic en una card/fila):** algunos, como `ActivityPreviewSheet`, ni siquiera tenían `className="w-full"` — solo usaban `data-[side=right]:sm:max-w-md` (que sí anula correctamente el `max-w-sm` base porque comparten el mismo "modifier chain" `data-[side=right]:sm:`, a diferencia de `w-full` suelto). Bajo `sm` seguían heredando el `w-3/4` base igual. Mismo fix: agregar `w-full!` al `className`. Vale la pena revisar el resto de los sheets de "preview" (`FunnelPreviewSheet`, `ContactPreviewSheet`, `OrganizationPreviewSheet`, `QuotationPreviewSheet`, etc.) por si tienen el mismo patrón cuando les toque su tabla.

**Pendiente separado:** evaluar el fix a nivel base (`sheet.tsx`) para no tener que repetir `w-full!` sheet por sheet — más alto impacto pero requiere probarlo con cuidado (afecta a todos los sheets del proyecto de una).

**Nota sobre "Crear Contacto"/"Crear Organización":** el ancho ya quedó bien (`w-full!`), pero el contenido interno (grids de 2 columnas: Nombre/Organización, etc.) todavía se ve apretado en mobile — eso es un ajuste aparte, por formulario, más grande. No se ha tocado todavía.

### 5. Layouts de 2 columnas (lista + detalle) — patrón "master-detail collapse"

Para vistas tipo inbox (Col 1 = lista de items, Col 2 = detalle/preview del item seleccionado — ej. Correo, Formularios > Respuestas), las 2 columnas simplemente no caben lado a lado en un celular. La solución (aplicada primero en Formularios > Respuestas, inspirada en cómo maneja esto la app de Empleos de Prohabla — lista de vacantes → detalle con botón "Volver"):

- **Solo en mobile**, mostrar una columna a la vez, nunca las 2 juntas — es un estado nuevo (`mobileShowDetail`), no algo que se derive de `useIsMobile()` solo. En desktop (`md:flex`) ambas columnas se fuerzan visibles siempre, sin importar ese estado.
  ```tsx
  const isMobile = useIsMobile()
  const [mobileShowDetail, setMobileShowDetail] = React.useState(false)
  ```
- **Col 1** (lista): `cn("w-full shrink-0 flex-col overflow-hidden border-r md:flex md:w-96", mobileShowDetail ? "hidden md:flex" : "flex")`
- **Col 2** (detalle): `cn("min-h-0 flex-1 flex-col overflow-hidden md:flex", mobileShowDetail ? "flex" : "hidden md:flex")`
- Al tocar un item de la lista: `setSelectedId(item.id); if (isMobile) setMobileShowDetail(true)` — en desktop nunca se activa esta navegación, el detalle simplemente cambia in-place como siempre.
- El componente de Col 2 recibe un `onBack?: () => void` opcional — solo se pasa en mobile (`onBack={isMobile ? () => setMobileShowDetail(false) : undefined}`), y si viene, renderiza un botón "← Volver a ___" arriba de todo. En desktop no se pasa, así que el botón no aparece — la Col 2 se ve exactamente igual que antes.
- Ojo: si cambia el filtro que recarga la lista desde cero (ej. cambiar de formulario), hay que resetear `mobileShowDetail` a `false` también — si no, alguien puede quedar "atrapado" viendo el detalle de un item que ya no está en la lista filtrada.

**Generalización a N columnas (Vacantes, 3 columnas):** el mismo patrón escala sin drama — en vez de un booleano, un estado con las N etapas (`"vacantes" | "postulantes" | "detalle"`), y cada columna se muestra solo si `mobileStep` coincide con su etapa (`md:flex` siempre fuerza visible en desktop). Cada columna intermedia (no la última) necesita su propio botón "Volver" local hacia la etapa anterior — la última columna reusa el mismo `onBack` que ya tenía el componente de detalle, sin tocarlo. El toolbar/filtros de la primera columna también se ocultan en mobile cuando no se está en esa etapa (`{(!isMobile || mobileStep === "primera-etapa") && (...)}`), porque dejan de tener sentido con esa columna fuera de vista.

Este mismo patrón debería aplicar a **Correo** cuando le toque, y a **Blog > BlogManager** si se decide hacerlo responsive (queda marcado como "aparte" más abajo).

## Checklist — qué falta replicar

- [x] Contactos — toolbar, tabla, sheets (Crear, Fusionar, Fusión manual, Importar/Exportar)
- [x] Organizaciones — toolbar, tabla, sheets (Crear, Fusionar, Fusión manual, Importar/Exportar)
- [x] Actividades — toolbar (compartido entre vista Lista y Board, con hasta 4 filtros variables según la vista), tabla (Lista), sheets (Crear Actividad, Preview)
- [x] Cotizaciones — toolbar (3 filtros + Restablecer como ítem del grid), tabla, 6 sheets (Crear, Preview, PDF Preview, Historial, Enviar, Asignar Plantilla)
- [x] Documentos — toolbar (2 filtros, grid de 2), tabla, sheets (Subir Documento, Preview)
- [x] Campañas — toolbar (1 filtro, ancho completo, con badge extra de "uso diario"), tabla, sheets (Crear Campaña, Preview)
- [x] Formularios — solo la vista **Lista** (`FormsTable.tsx`, es la que es datatable de verdad): toolbar (2 filtros, grid de 2), tabla, sheets (Crear Formulario, Integrar formulario)
- [x] Widgets AI — toolbar (2 filtros, grid de 2), tabla, sheet (Crear Widget)
- [x] Blog — solo la tabla de **Blogs** (`BlogsTable.tsx`, lista de blogs): toolbar (1 filtro, ancho completo), tabla, sheet (Crear/Editar Blog)
- [x] Oportunidades — toolbar (compartido entre Lista y Board, con Pipeline+Estado siempre y Responsable+Restablecer solo en Board — mismo criterio de Restablecer-como-ítem-del-grid que Actividades/Cotizaciones), tabla (Lista), sheets (Crear Oportunidad, Preview)
- [x] Paginación — arreglado a nivel de componente compartido (afecta a todas las tablas ya)
- [x] Formularios > Respuestas (`FormAnswersBoard.tsx`) — primer caso del patrón "master-detail collapse" (sección 5): toolbar + navegación lista→detalle en mobile con botón "Volver" en `FormAnswerDetail.tsx`
- [x] Formularios > Vacantes (`VacantesBoard.tsx`) — generalización a 3 columnas del mismo patrón (Vacante → Postulantes → Detalle), navegación por etapas con `mobileStep`
- [ ] Oportunidades — vista **Sugerencias** (`suggestions/SuggestionsView.tsx`): es un feed de cards, no un datatable — fuera de este patrón, como BlogManager
- [ ] Blog — `BlogManager.tsx` (gestor de artículos dentro de un blog, drag-and-drop): tampoco es un datatable — aparte
- [ ] Correo — layout de 2 columnas, candidato directo para el patrón master-detail de la sección 5
- [ ] Usuarios (`UsersTable.tsx` / Configuración > Equipo)
- [ ] Contenido interno de los sheets "Crear ___" (grids de 2 columnas → 1 columna en mobile) — aparte, por formulario
- [ ] Evaluar fix del bug de `Sheet` a nivel de componente base, para no repetir `w-full!` en cada sheet nuevo
- [ ] El shell post-login completo (sidebar, layout general) — al final, como quedamos
