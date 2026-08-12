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

Sheets ya arreglados así: `CreateContactSheet`, `DuplicateContactsSheet`, `MergeContactsSheet`, `ContactsImportExportSheet`, `CreateOrganizationSheet`, `DuplicateOrganizationsSheet`, `MergeOrganizationsSheet`, `OrganizationsImportExportSheet`, `CreateActivitySheet`, `ActivityPreviewSheet`, `contacts/detail/sheets/InterestSheet`, `contacts/detail/sheets/NoteSheet`, `organizations/detail/sheets/ChallengeSheet`, `organizations/detail/sheets/NoteSheet`, `organizations/detail/sheets/LinkContactSheet`.

**Variante con `style={{ maxWidth: N }}` en vez de clase de ancho máximo:** algunos sheets (los de `contacts/detail/sheets/` y `organizations/detail/sheets/`) fijan el ancho máximo con un `style={{ maxWidth: 420 }}` inline en vez de una clase Tailwind — funciona igual, pero si falta el `className="w-full!"` al lado, el sheet se queda angosto en mobile (mismo bug base, solo que sin el `className="w-full"` de partida que hiciera evidente el problema). Mismo fix: agregar `className="w-full!"` sin tocar el `style` existente. Confirmado en los 5 sheets de ambas carpetas `detail/sheets/` — si aparece una carpeta `detail/sheets/` nueva (Oportunidades, Actividades), revisar ahí primero por este mismo patrón.

**Variante del mismo bug — sheets de "preview" (al hacer clic en una card/fila):** algunos, como `ActivityPreviewSheet`, ni siquiera tenían `className="w-full"` — solo usaban `data-[side=right]:sm:max-w-md` (que sí anula correctamente el `max-w-sm` base porque comparten el mismo "modifier chain" `data-[side=right]:sm:`, a diferencia de `w-full` suelto). Bajo `sm` seguían heredando el `w-3/4` base igual. Mismo fix: agregar `w-full!` al `className`. Vale la pena revisar el resto de los sheets de "preview" (`FunnelPreviewSheet`, `ContactPreviewSheet`, `OrganizationPreviewSheet`, `QuotationPreviewSheet`, etc.) por si tienen el mismo patrón cuando les toque su tabla.

**Pendiente separado:** evaluar el fix a nivel base (`sheet.tsx`) para no tener que repetir `w-full!` sheet por sheet — más alto impacto pero requiere probarlo con cuidado (afecta a todos los sheets del proyecto de una).

**Variante al revés — sheet angosto que el bug ensancha/descuadra (`ContactSheet` de Mensajería):** no todos los sheets deben terminar en `w-full!` — `ContactSheet.tsx` es un panel angosto tipo tarjeta de contacto (diseño original: fijo en `w-80`/`max-w-80`, 320px, en cualquier pantalla). Mismo bug de especificidad, pero acá ni siquiera el ancho angosto intencional se aplicaba: la clase suelta `w-80` (y `sm:max-w-80`, que tampoco comparte la cadena de modificadores `data-[side=right]:sm:` de la base) perdían igual contra `data-[side=right]:w-3/4` / `data-[side=right]:sm:max-w-sm`. Fix: `w-80!` + `max-w-80!` — mismo mecanismo de `!important`, pero preservando el ancho angosto en vez de forzar `w-full`. Antes de aplicar `w-full!` en automático a un sheet nuevo, confirmar que el diseño realmente lo pide — si es un panel chico tipo preview/tarjeta, puede que la clase correcta sea la propia con `!`, no `w-full!`.

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

**Variante con "Nav" en vez de columna de contenido (Mensajería):** cuando la Col 1 no es una lista de items sino un *nav/filtro* (ej. `MessagingNav` — Mi bandeja/WhatsApp/Instagram/Messenger/agentes), **no** conviene tratarla como una etapa más del drill-down (obligaría a pasar por una pantalla de "elegir canal" antes de ver nada, incluso cuando el default — "Mi bandeja" — ya trae todo). En vez de eso:

- La Col 1 (nav) se oculta del todo en mobile (`hidden ... md:flex`, nunca se muestra ahí) — no se convierte en un paso.
- Se reemplaza por un **`Select`** (mismo patrón de la sección 6) metido en el header de la Col 2 (la lista), donde antes iba el título fijo — cambia de canal sin salir de la lista, sin pantalla intermedia.
- El componente de la lista (`ConversationList`) recibe ese Select ya armado como prop (`channelSelect?: React.ReactNode`) en vez de construirlo él mismo — así no necesita conocer `agents`/counts/etc., eso vive en la página padre que ya lo tenía.
- El truco de layout: el Select se pasa con clase `w-full md:hidden`; el header de la lista pasa de `flex items-center` a `flex flex-wrap items-center` — en mobile el Select (100% ancho) fuerza un salto de línea y el resto (refrescar, tabs Todos/No leídos) cae a la fila de abajo; en desktop el Select ni se renderiza, así que no hay wrap y la fila queda idéntica a como estaba.
- Col 2 ⇄ Col 3 (lista ⇄ detalle) quedan como el master-detail normal de 2 pasos de más arriba, **arrancando en la lista** (`mobileShowChat` default `false`), no en un paso "nav" — el nav nunca fue un paso, así que no hay nada antes de la lista.
- Al cambiar de canal (`activeView`) hay que resetear `mobileShowChat` a `false` — mismo motivo que resetear `mobileShowDetail` al cambiar de filtro: si no, se puede quedar "atrapado" viendo un chat que ya no pertenece al canal filtrado.

Aplicado en Mensajería (`crm/messaging/page.tsx` + `ConversationList.tsx` + `ConversationView.tsx`) y en Correo (`crm/mail/page.tsx` + `MailList.tsx` + `MailDisplay.tsx`), casi calcado.

**Variante sin Col 2/3 — solo Nav + contenido, navegación real por ruta (Configuración):** `SettingsNav` no tiene lista+detalle detrás, son 2 columnas nomás (nav + `children` de Next.js) y cada sección es una **ruta propia** (`/settings/profile`, `/settings/workspace`, ...), no un estado de cliente — así que no hace falta `mobileStep` ni `mobileShowDetail` en absoluto, cambiar de sección ya es "volver" en el sentido de Next.js. El nav se oculta en mobile y se reemplaza por un `Select` que agrupa por categoría con `SelectGroup`/`SelectLabel` (mismos que ya expone `select.tsx`) — mismo criterio visual que las categorías del nav de escritorio (Cuenta/Equipo/Datos/Desarrolladores). El `value` del Select es directamente el `pathname` actual y `onValueChange` hace `router.push(href)` — no hay paso de "menú" antes del contenido, se aterriza igual que hoy (en `/settings/profile`, por el redirect de `settings/page.tsx`). El contenedor padre (`settings/layout.tsx`) pasa de `flex` a `flex-col md:flex-row` para que el Select (mobile) quede arriba a lo ancho y el nav de escritorio (`hidden md:flex`) vuelva a ser una columna lateral desde `md`.

**Nota de Correo — acción extra en la Col 1 (Nav):** a diferencia de Mensajería, `MailNav` tenía un botón "Redactar" propio arriba de las carpetas — al ocultar la Col 1 en mobile ese botón también desaparecía. Se resolvió agregándolo **junto al Select de carpeta** en el mismo bloque `mobileHeader` (Select `flex-1` + botón `shrink-0`, una sola fila) — mismo criterio que un Row 1 de "selector + crear" (sección 6), no algo nuevo. Si otra vista con esta variante tiene una acción de nivel-Nav así, el mismo truco aplica: se cuela en el bloque del Select en vez de perderse.

**Nota de Correo — estados vacíos de la lista (sin Gmail conectado / carpeta no conectada / cargando):** esos 3 estados viven en `page.tsx`, no dentro de `MailList`, así que no reciben `mobileHeader` automáticamente — hay que pasárselo a mano en cada rama (`<div className="border-b px-4 py-2 md:hidden">{mobileHeader}</div>` antes del contenido del estado) para que el selector de carpeta siga disponible aunque la carpeta activa esté vacía o Gmail no esté conectado.

### 6. Selector de vista en mobile (Row 1 con 3+ píldoras + botón "Crear")

Cuando el Row 1 tiene un grupo de píldoras (Lista/Board, Lista/Board/Sugerencias, Lista/Respuestas/Vacantes) **más** un botón "+ Crear ___" a la derecha, en mobile el `justify-between` no da el ancho — con 3 píldoras se nota más, pero con 2 (Actividades) también pasa (nombres largos del botón "Crear" + el propio grupo ya son suficiente). Aplicar el selector siempre que Row 1 combine grupo de vistas + botón crear, sin asumir que 2 píldoras "sí entran".

Fix: en mobile, el grupo de píldoras se reemplaza por un `Select` (mismo componente `@/components/ui/select` usado en toda la app) que muestra ícono+label de la vista activa y despliega el resto como opciones. En desktop el grupo de píldoras original queda intacto.

```tsx
const VIEW_OPTIONS: { value: View; label: string; icon: React.ElementType }[] = [
  { value: "lista",  label: "Lista",  icon: ListIcon },
  { value: "board",  label: "Board",  icon: KanbanSquareIcon },
  // ...
]

<Select value={view} onValueChange={(v) => changeView(v as View)}>
  <SelectTrigger size="sm" className="w-32 shrink-0 md:hidden">
    <SelectValue placeholder="Vista">
      {(v: View) => {
        const opt = VIEW_OPTIONS.find((o) => o.value === v)
        if (!opt) return v
        return <span className="flex items-center gap-1.5"><opt.icon className="size-3.5" />{opt.label}</span>
      }}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    {VIEW_OPTIONS.map((opt) => (
      <SelectItem key={opt.value} value={opt.value}><opt.icon className="size-3.5" />{opt.label}</SelectItem>
    ))}
  </SelectContent>
</Select>

<div className="hidden items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5 md:flex">
  {/* píldoras originales, sin cambios */}
</div>
```

⚠️ Usar el patrón de función en `SelectValue` (no `{v}` directo) — ver bug conocido de `base-ui` donde `SelectValue` no mapea `value → label` solo.

Aplicado en Formularios (`FormsView.tsx`, Lista/Respuestas/Vacantes), Oportunidades (`FunnelKanban.tsx`, Lista/Board/Sugerencias) y Actividades (`ActivityKanban.tsx`, Lista/Board).

### 7. Vistas de detalle de 3 columnas "paralelas" (no master-detail) — selector de columna

Distinto del patrón de la sección 5 (lista → detalle, jerárquico): acá las 3 columnas son **pares**, no una navegación de "entrar más profundo" — ej. `ContactDetail.tsx` (Col1 Propiedades del contacto, Col2 Tabs con Historial/Oportunidades/etc., Col3 Resumen + Organización). En mobile, igual que antes, no caben lado a lado — pero como no hay jerarquía ni "Volver", se resuelve con el mismo **selector `Select`** de la sección 6 en vez de botones de "Volver".

- Estado simple, sin `useIsMobile()` (el CSS ya lo resuelve solo): `const [mobileView, setMobileView] = React.useState<"info" | "detalle" | "resumen">("detalle")` — el default es la columna con el contenido principal (acá Col2, el feed de actividad), no la primera columna del layout.
- El `Select` va en su propia fila, debajo del header y arriba de las columnas, oculta en desktop (`md:hidden`).
- Cada columna: `cn("w-full shrink-0 flex-col ... md:flex md:w-[25%]", mobileView === "info" ? "flex" : "hidden md:flex")` (la columna central usa `flex-1` en vez de `w-[25%]`/`md:w-[25%]`). En desktop `md:flex` fuerza las 3 visibles siempre, sin importar `mobileView`.

Aplicado en Contactos (`ContactDetail.tsx`). Candidato directo para replicar en Organizaciones (`organizations/detail/`, misma estructura de carpeta Col1Info/Col2Tabs/Col3Related) cuando le toque.

### 8. Shell compartido — `PageHeader.tsx`

Adelantado del ítem "shell post-login, al final" — surgió al pasar por Mensajería porque el header se veía roto ahí (descripción envolviendo en 3 líneas dentro de un `h-16` fijo). `PageHeader.tsx` lo usan **16 páginas** (Contactos, Organizaciones, Actividades, Cotizaciones, Mensajería, etc.), así que el fix beneficia a todas de una:

- La descripción (segunda línea, bajo el título) se oculta en mobile (`hidden ... md:block`) — ahí no hay espacio para dos líneas de texto dentro de un header de altura fija, y el título solo ya identifica la página.
- Título y descripción llevan `truncate` + el contenedor `min-w-0` en cada nivel del flex (el bloque izquierdo, el bloque ícono+texto, y el `leading-tight` final) — sin `min-w-0` en la cadena, `truncate` no tiene efecto porque el flex item no se deja achicar por debajo de su contenido.
- `SidebarTrigger`, el `Separator` y el ícono llevan `shrink-0` — así lo que se achica/trunca es siempre el texto, nunca los controles.

El resto del shell (sidebar, layout general) sigue pendiente para el final, como quedamos — esto fue solo el header porque estaba a la vista y el fix era chico y acotado.

### 9. Grilla de calendario (mes) — puntos en vez de pills en mobile

`MonthView.tsx` (usado por Calendario) es un grid fijo de 7 columnas — cada celda mostraba hasta 3 "pills" de evento (título truncado + hora) más "+N más". Eso no cabe legible en un celular. A diferencia de las secciones 5/6/7, acá **no hace falta ningún paso ni Select nuevo** — tocar un día ya abría `DayActivitiesSheet` (el detalle completo de ese día) en cualquier pantalla, así que la solución es solo *aligerar la celda*, no navegar distinto:

- **Solo en mobile**, la celda no lista pills — muestra el número del día + una fila de **puntos** (uno por evento, tope `MAX_DOTS = 4`, después "+N"). Actividades usan un color por tipo (`DOT_COLOR`, mismos matices que `ACTIVITY_TYPE_CONFIG` pero en tono sólido -500 en vez del fondo pálido -50 que usan las pills — a tamaño de punto un fondo pálido no se distingue). Eventos de Google usan un punto celeste fijo.
- La altura mínima de cada fila de la grilla (`gridTemplateRows`, hoy `minmax(112px, 1fr)`) también depende de `isMobile` — en mobile baja a `64px` porque ya no necesita espacio para pills, solo para el número + una fila de puntos. Como es un `style` inline (el número de semanas del mes varía, no se puede resolver con clases Tailwind fijas), el alto se calcula en JS: `isMobile ? 64 : 112`.
- Tocar el día sigue abriendo el mismo `DayActivitiesSheet` de siempre — cero cambios ahí más que el fix de ancho de la sección 4 (tenía el mismo bug `data-[side=right]:sm:max-w-md` sin `w-full!`).

Aplicado en `MonthView.tsx`. Sheets del flujo de Calendario arreglados de paso: `DayActivitiesSheet`, `GoogleEventPreviewSheet` (mismo bug, mismo fix `w-full!`) — `ActivityPreviewSheet`/`CreateActivitySheet` ya venían arreglados desde la sección de Actividades.

## Checklist — qué falta replicar

- [x] Contactos — toolbar, tabla, sheets (Crear, Fusionar, Fusión manual, Importar/Exportar)
- [x] Contactos > Detalle (`ContactDetail.tsx`) — 3 columnas paralelas (sección 7): selector Info/Detalle/Resumen, default "Detalle"
- [x] Contactos > Detalle > tab Oportunidades (`detail/tabs/OportunidadesTab.tsx`) — mismo patrón de toolbar+columnas que Contactos/Organizaciones, aplicado dentro de un datatable anidado en un tab
- [x] Contactos > Detalle > tab Actividades (`detail/tabs/ActividadesTab.tsx`) — ídem
- [x] Organizaciones — toolbar, tabla, sheets (Crear, Fusionar, Fusión manual, Importar/Exportar)
- [x] Organizaciones > Detalle (`OrganizationDetail.tsx`) — 3 columnas paralelas (sección 7): selector Info/Detalle/Resumen, default "Detalle"
- [x] Organizaciones > Detalle > tab Oportunidades (`detail/tabs/OportunidadesTab.tsx`) — toolbar+columnas, mismo patrón
- [x] Organizaciones > Detalle > tab Actividades (`detail/tabs/ActividadesTab.tsx`) — ídem
- [x] Organizaciones > Detalle > tab Contactos (`detail/tabs/ContactosTab.tsx`) — ídem, con 2 botones de acción (Columnas + Vincular contacto) en vez de 1
- [x] Organizaciones > Detalle > sheets (`ChallengeSheet`, `NoteSheet`, `LinkContactSheet`) — fix `w-full!`
- [x] Actividades — toolbar (compartido entre vista Lista y Board, con hasta 4 filtros variables según la vista), tabla (Lista), sheets (Crear Actividad, Preview), selector de vista en mobile (sección 6, Lista/Board)
- [x] Actividades > Detalle (`ActivityDetail.tsx`) — 3 columnas paralelas (sección 7): selector Info/Detalle/Resumen, default "Detalle". Sin tabs datatable acá (`HistorialTab`/`NotasTab` son listas de cards) — solo hizo falta el selector + el sheet
- [x] Actividades > Detalle > sheet `NoteSheet` — fix `w-full!` (mismo bug de siempre)
- [x] Cotizaciones — toolbar (3 filtros + Restablecer como ítem del grid), tabla, 6 sheets (Crear, Preview, PDF Preview, Historial, Enviar, Asignar Plantilla)
- [x] Documentos — toolbar (2 filtros, grid de 2), tabla, sheets (Subir Documento, Preview)
- [x] Campañas — toolbar (1 filtro, ancho completo, con badge extra de "uso diario"), tabla, sheets (Crear Campaña, Preview)
- [x] Formularios — solo la vista **Lista** (`FormsTable.tsx`, es la que es datatable de verdad): toolbar (2 filtros, grid de 2), tabla, sheets (Crear Formulario, Integrar formulario), selector de vista en mobile (sección 6, Lista/Respuestas/Vacantes)
- [x] Widgets AI — toolbar (2 filtros, grid de 2), tabla, sheet (Crear Widget)
- [x] Blog — solo la tabla de **Blogs** (`BlogsTable.tsx`, lista de blogs): toolbar (1 filtro, ancho completo), tabla, sheet (Crear/Editar Blog)
- [x] Oportunidades — toolbar (compartido entre Lista y Board, con Pipeline+Estado siempre y Responsable+Restablecer solo en Board — mismo criterio de Restablecer-como-ítem-del-grid que Actividades/Cotizaciones), tabla (Lista), sheets (Crear Oportunidad, Preview), selector de vista en mobile (sección 6, Lista/Board/Sugerencias)
- [x] Oportunidades > Detalle (`FunnelDetail.tsx`) — 3 columnas paralelas (sección 7): selector Info/Detalle/Resumen, default "Detalle". El más grande hasta ahora: 8 tabs (Historial, Notas, Actividades, Documentos, Cotizaciones, Facturas, Correo, WhatsApp)
- [x] Oportunidades > Detalle > tab Actividades (`detail/tabs/ActividadesTab.tsx`) — toolbar+columnas (2 botones de acción: Columnas + "+ Actividad"), más fix de avatar hardcodeado en Responsable (mismo bug que Col1Info, `d.user.avatar_url`)
- [x] Oportunidades > Detalle > tab Documentos (`detail/tabs/DocumentosTab.tsx`) — toolbar+columnas (solo Nombre queda visible, sin Responsable involucrado)
- [x] Oportunidades > Detalle > tab Cotizaciones (`detail/tabs/CotizacionesTab.tsx`) — toolbar+columnas (3 botones de acción: Columnas + "Plantilla de la oportunidad" + "+ Cotización"); el avatar de Responsable ya estaba bien hecho acá (`responsible.avatarUrl`), no hizo falta tocarlo
- [x] Oportunidades > Detalle > tab Facturas (`detail/tabs/FacturasTab.tsx`) — toolbar+columnas+filtros (grid de 2, mismo criterio que tablas principales); es un stub "Próximamente" con overlay y `data: []` fijo, pero el toolbar igual se renderiza así que se ajustó por consistencia
- [x] Oportunidades > Detalle > sheets (`FileOpportunitySheet`, `NoteSheet`) — fix `w-full!`
- [x] Paginación — arreglado a nivel de componente compartido (afecta a todas las tablas ya)
- [x] Formularios > Respuestas (`FormAnswersBoard.tsx`) — primer caso del patrón "master-detail collapse" (sección 5): toolbar + navegación lista→detalle en mobile con botón "Volver" en `FormAnswerDetail.tsx`
- [x] Formularios > Vacantes (`VacantesBoard.tsx`) — generalización a 3 columnas del mismo patrón (Vacante → Postulantes → Detalle), navegación por etapas con `mobileStep`
- [x] Mensajería (`crm/messaging/page.tsx`) — variante "Nav" del master-detail (sección 5): Col1 `MessagingNav` se oculta en mobile y se reemplaza por un `Select` de canal dentro del header de la lista (patrón sección 6); Lista ⇄ Chat es master-detail normal de 2 pasos, arrancando en la lista (no hay paso de "elegir canal")
- [x] Mensajería > sheets (`ContactSheet.tsx`) — variante angosta del bug de sheets (sección 4): `w-80!`/`max-w-80!` en vez de `w-full!`, porque el diseño original es un panel chico, no uno full-width
- [x] Correo (`crm/mail/page.tsx`) — misma variante "Nav" que Mensajería: Col1 `MailNav` oculta, Select de carpeta (reusa la lista `folders` exportada de `MailNav.tsx`) + botón "Redactar" juntos en el header de la lista; Lista ⇄ Correo arranca en la lista. Estados vacíos de la lista (sin Gmail, carpeta no conectada, cargando) reciben el `mobileHeader` a mano porque viven en `page.tsx`, no en `MailList`
- [x] Shell — `PageHeader.tsx` (sección 8), adelantado del ítem de shell de más abajo: descripción oculta en mobile, título con truncate real (cadena de `min-w-0`). Beneficia a las 16 páginas que lo usan.
- [x] Calendario (`CrmCalendar.tsx` + `MonthView.tsx`) — grilla compacta con puntos en mobile (sección 9), reusa `DayActivitiesSheet` sin cambios de flujo. Sheets `DayActivitiesSheet`/`GoogleEventPreviewSheet` — fix `w-full!`
- [x] Configuración (`settings/layout.tsx` + `SettingsNav.tsx`) — variante "solo Nav + contenido, ruta real" (sección 5): nav oculto en mobile, reemplazado por un `Select` agrupado por categoría; aterriza directo en Perfil, sin paso de menú previo. Contenido interno de cada página (`ProfileForm.tsx` y similares — grids de 2 columnas Nombre/Correo, fila de avatar) queda **pendiente**, mismo criterio que el contenido de los sheets "Crear ___"
- [x] Configuración > Equipo > Usuarios (`UsersTable.tsx`) — toolbar (2 filtros fijos y pares, Restablecer en fila propia — mismo criterio que Contactos/Organizaciones), tabla, sheet (`InviteUserSheet` — fix `w-full!`, tenía `className="w-full"` sin el `!`). Esta tabla tenía un intento previo de responsividad con breakpoint `sm:` (640px) en vez de `md:` (768px) como el resto de la app — se normalizó a `md:` para que el punto de quiebre sea consistente con todas las demás tablas
- [ ] Configuración > Equipo > Invitados (`InvitedUsersTable.tsx`) — misma página (tab al lado de Usuarios), mismo patrón directo a aplicar cuando le toque
- [x] Configuración > Catálogos (`CatalogsGrid.tsx`) — no es un datatable, es un grid de cards (`grid-cols-2 sm:grid-cols-3 xl:grid-cols-4`) que nunca bajaba a 1 columna — con 2 columnas fijas hasta en el celular más chico, el nombre del catálogo se truncaba ("Corr...", "Telé..."). Fix mínimo: base a `grid-cols-1` (nada más — `sm:`/`xl:` quedan intactos, cero cambio en pantallas ≥640px). Sheet `CatalogOptionsSheet` — mismo bug sutil que `InviteUserSheet` (`className="w-full"` sin el `!`), corregido
- [x] Configuración > Productos (`ProductsTable.tsx`) — sí era un datatable (no un grid de cards como Catálogos). Toolbar+columnas, mismo patrón; normalizado de `sm:` a `md:` (tenía el mismo breakpoint viejo que Usuarios). Sheet `CreateProductSheet` — fix `w-full!`
- [x] Configuración > Embudos (`FunnelsTable.tsx`) — ídem Productos. Sheet `CreateFunnelSheet` — fix `w-full!`
- [x] Configuración > Plantillas (`PdfTemplatesTable.tsx`) — ídem, pero esta tabla no tenía **ningún** sistema de `columnVisibility` (ni estado, ni dropdown "Visualización") — se agregó de cero, no solo el `MOBILE_COLUMN_VISIBILITY`. Sheets `CreatePdfTemplateSheet`, `PdfTemplatePreviewSheet`, `EditBlockSheet` — fix `w-full!` en los 3
- [x] Configuración > Integraciones (`IntegrationsGrid.tsx`) — el grid ya estaba bien (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`, arrancaba en 1 columna), no hizo falta tocarlo. Los 5 sheets de conectar/configurar sí tenían el bug de siempre (`className="w-full"` sin `!`): `InstagramIntegrationSheet`, `CargoIntegrationSheet`, `WhatsAppIntegrationSheet`, `AgentPickerSheet`, `N8nIntegrationSheet` — los 5 corregidos
- [ ] Oportunidades — vista **Sugerencias** (`suggestions/SuggestionsView.tsx`): es un feed de cards, no un datatable — fuera de este patrón, como BlogManager
- [ ] Blog — `BlogManager.tsx` (gestor de artículos dentro de un blog, drag-and-drop): tampoco es un datatable — aparte
- [ ] Contenido interno de los sheets "Crear ___" y de las páginas de Configuración (`ProfileForm.tsx` y similares — grids de 2 columnas → 1 columna en mobile) — aparte, por formulario
- [ ] Evaluar fix del bug de `Sheet` a nivel de componente base, para no repetir `w-full!`/`w-N!` en cada sheet nuevo
- [ ] El shell post-login completo (sidebar, layout general) — el header (`PageHeader.tsx`) ya quedó, falta el resto
