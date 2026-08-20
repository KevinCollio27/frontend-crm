# Patrón de toolbar para DataTables

Referencia de cómo se reordenó la barra de herramientas de `ContactsTable.tsx` para que no
se rompa cuando el sidebar está expandido (menos ancho disponible). Contactos es la
implementación de referencia — aplicar esto mismo al resto de tablas con la misma estructura
de 2 filas (Organizaciones primero, después el resto: Cotizaciones, Documentos, Blogs,
Formularios, Funnels, Productos, Widgets IA — ver `docs/` u otros pattern docs para el estado
de búsqueda por ID en cada una).

## Problema original

Todo vivía en una sola fila (`Buscar` + filtros tipo selector + contador + 4-5 botones de
acción), con `flex-wrap`. Con el sidebar abierto, el ancho baja y se apretaba todo — el
contador de registros quedaba casi invisible entre los filtros y los botones.

## Estructura nueva (3 filas)

```
Fila 1:  [Lista]                                          [+ Crear Contacto]

Fila 2:  [🔍 Buscar]  [Columnas ▾]  [Filtros ▾]  [Restablecer]     [Importar/Exportar]  [Más Opciones ▾]

Fila 3 (colapsada por defecto, toggle con el botón "Filtros" de la fila 2):
         [Organización ▾]   [País ▾]
```

### Fila 2 — orden fijado

`Buscar → Columnas → Filtros → Restablecer` a la izquierda; `Importar/Exportar → Más Opciones`
al final a la derecha (`md:ml-auto`).

- **Columnas** y **Filtros** comparten el mismo lenguaje visual: ícono a la izquierda (`Columns3Icon`,
  `SlidersHorizontalIcon`), texto, `ChevronDown` que rota 180° cuando está abierto.
- Para que la flecha de **Columnas** rote hace falta controlar el `open` del `DropdownMenu`
  (`open={columnsOpen} onOpenChange={setColumnsOpen}` — base-ui soporta el patrón controlado
  normal de React). **Filtros** no es un `DropdownMenu`, es un botón que togglea `filtersOpen`
  a mano y muestra/oculta la fila 3.
- **Restablecer** solo aparece si `hasActiveFilters` (igual que antes, sin cambios de lógica).
- **Más Opciones** agrupa lo que antes eran botones sueltos en desktop + un dropdown aparte
  solo para mobile (`Importar con Google`, `Fusionar duplicados`, `Mover de espacio`). Mismo
  truco de `open`/`onOpenChange` + flecha rotando.
- **Importar / Exportar** se dejó afuera del dropdown, como botón visible siempre — es de las
  acciones más usadas, no tenía sentido esconderla.

### Fila 3 — filtros avanzados

Contiene lo que antes vivía inline en la fila 2: `OrgFilter` (selector de organización con
búsqueda server-side) y `DataTableFacetedFilter` de País. Se muestra solo si `filtersOpen`.
Fondo `bg-muted/30` para diferenciarla visualmente de las otras dos filas.

## Contador de registros — pendiente

El `{total} contactos` que vivía en la fila 2 se **ocultó** (comentado en el código, no
borrado — ver el comentario en `ContactsTable.tsx` justo antes de "Importar / Exportar").
Con el sidebar expandido no había espacio y quedaba casi invisible. Falta decidir dónde va:
ideas sobre la mesa (fila 1 junto a "Lista"/"Crear Contacto", badge propio, etc.) — se define
en otra sesión de planificación, junto con el tema de qué hacer con la selección de filas
(checkboxes) que hoy casi no se usa. Ver conversación con Kevin para el análisis de esa parte.

## Checklist para replicar en otra tabla

1. Fila 1 sin tocar (o adaptar si esa tabla no tiene toggle Lista/Kanban).
2. Fila 2: `Buscar` → filtros tipo selector convertidos a un botón "Columnas" (si aplica) →
   botón "Filtros" (togglea fila 3) → "Restablecer" condicional. A la derecha: botones sueltos
   de uso frecuente + "Más Opciones" agrupando el resto.
3. Fila 3: mover ahí los `DataTableFacetedFilter`/selectores que antes vivían en fila 2,
   condicionada a `filtersOpen`.
4. Ojo con `flex-wrap` en los grupos de botones — sin eso se puede desbordar en mobile aunque
   en desktop se vea bien (nos pasó en Contactos, se corrigió agregando `flex-wrap` al grupo
   Columnas/Filtros/Restablecer).
5. No mover el contador todavía — sigue pendiente de definir en Contactos primero.
