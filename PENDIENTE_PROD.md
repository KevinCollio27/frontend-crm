# Pendiente para Prod / Futuro

## 1. Fix de datos: sincronizar `status` con `is_completed` (Actividades)

**Contexto:** `opportunity_activity.status` es un campo relativamente nuevo (`NOT NULL DEFAULT 'pendiente'`). Las actividades marcadas como completadas *antes* de que el flujo de escritura actual (`complete()` en el backend) sincronizara ambos campos se quedaron con `status='pendiente'` aunque `is_completed=true`. Esto hacía que el Board de Actividades mostrara casi todo en la columna "Pendiente" con el conteo real ya implementado.

**Ya validado en dev** (160 filas corregidas, 0 casos raros). Falta correr en prod.

```sql
UPDATE sch_core.opportunity_activity
SET status = 'completada'
WHERE is_deleted = false
  AND is_completed = true
  AND status = 'pendiente';
```

Verificación post-fix (debería devolver solo `pendiente`/`completada`, sin filas huérfanas):

```sql
SELECT status, is_completed, count(*)
FROM sch_core.opportunity_activity
WHERE is_deleted = false
GROUP BY status, is_completed
ORDER BY count(*) DESC;
```

- [ ] Correr el `UPDATE` en prod (vía pgAdmin, mismo procedimiento que en dev)
- [ ] Verificar con el query de arriba
- [ ] Confirmar que el Board de Actividades en prod muestra los conteos correctos

## 2. Código pendiente de desplegar a prod

Todo esto ya está en dev y probado, falta el deploy normal cuando corresponda:

- **Avatar de perfil de usuario** — `avatar_url` en `User`, upload real (R2), conectado en Perfil, sidebar, y en "Responsable" de Oportunidades y Actividades (tabla, Kanban, preview, selector al crear/editar). Requiere migración de schema (`avatar_url` en `User`) — la corre Kevin manualmente en prod, como siempre.
- **Board de Actividades**: paginación real por columna ("Cargar más"), conteo real por status (endpoint `opportunity-activity/status-counts`), fix del bug de `status` no reenviado en `findAllPaginate` (controller `all`).
- **Responsable preseleccionado** al crear Oportunidad y Actividad (usuario de la sesión activa).

## 3. Futuro — etapas configurables + vista Gantt

Idea a mediano plazo, todavía sin diseñar en detalle:

- Hoy las 4 columnas del Board de Actividades (`pendiente/en_progreso/completada/cancelada`) están hardcodeadas en el frontend (`BOARD_STAGES`), sobre un `status` varchar libre — no es una tabla de etapas configurable como `flow_stage` en Oportunidades.
- Dos caminos posibles para etapas configurables:
  1. Tabla nueva `activity_stage` (espejo de `flow_stage`, con `order_number` por flow).
  2. Reusar el sistema de catálogos genérico que ya existe (`catalogService.getLabelOptions`, el mismo que usan `activity_type` y `priority`) — más barato de construir, la infraestructura ya está.
- Para una vista Gantt: `date_from`/`date_to` están siempre poblados en prod (0 nulos), pero **23 actividades tienen `date_to` anterior a `date_from`** (rango invertido) — hay que blindar eso antes de renderizar barras de duración.

```sql
-- Detectar rangos invertidos
SELECT id, opportunity_id, date_from, date_to
FROM sch_core.opportunity_activity
WHERE is_deleted = false
  AND date_to IS NOT NULL AND date_from IS NOT NULL
  AND date_to < date_from;
```
