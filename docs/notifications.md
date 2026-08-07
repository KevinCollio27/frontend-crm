# Notificaciones (campanita)

## Estado actual: mock, sin conectar

`BellButton.tsx` (`src/components/dashboard/BellButton.tsx`) pasó de ser un botón decorativo
(sin `onClick`, el "bug" de que se ponía gris al hacer clic era solo su propio estado `:active`
sin nada atrás) a un `Popover` funcional — pero **con datos de prueba hardcodeados**
(`INITIAL_MOCK` dentro del mismo archivo), no conectado a ningún backend todavía. Sirve para
validar el diseño antes de cablear la parte real.

## Lo que el backend ya tiene listo (para cuando se conecte)

`goxt-backend-crm` ya trae la plomería, solo no se usa desde el frontend:

- Tabla `notification` (`title`, `body`, `type`, `entity_type`, `entity_id`, `action_url`, `read_at`).
- `createNotification()` en `notification.service.ts` — hoy solo se llama para eventos de agente IA
  (`agent_action`, `agent_notify`) y `file_export`. **Nunca se llama al llegar un mensaje nuevo** —
  ese hook falta agregarlo en los handlers de mensajes entrantes (WhatsApp/Instagram/Facebook/Widget),
  trabajo de backend, no de este repo.
- API REST: `GET /notification/unread-count`, `GET /notification`, `PUT /notification/read-all`,
  `PUT /notification/:id/read`.
- Socket.io con salas por workspace (`emitToRoom`, `join-workspace-room`) — mismo mecanismo que ya
  usa `useEntityRealtime` (`src/hooks/useEntityRealtime.ts`) para refrescar tablas en tiempo real.

## Diseño: cada tipo de alerta tiene su propia card

No hay una card genérica única — el contenido y el ícono cambian según qué generó la notificación:

- **Mensajería** — cubre 4 variantes por canal (WhatsApp, Instagram, Facebook, Widget IA), cada una
  con su color de marca y su ícono, reusando `ChannelBadge.tsx`
  (`src/components/dashboard/messaging/ChannelBadge.tsx`) — el mismo componente que ya pinta los
  badges en la lista de conversaciones de Mensajería, para que un canal se reconozca igual en los
  dos lugares. Colores: WhatsApp `#25D366`, Instagram `#E4405F`, Facebook `#1877F2`, Widget IA
  `#7C3AED` (violeta — mismo tono que usa el resto de la app para todo lo relacionado a IA).
  Cada card lleva un borde izquierdo de 3px con el color del canal, visible siempre (leída o no) —
  el estado leído/no leído se marca aparte con negrita + punto azul, no ocultando el color.
- **Otros tipos futuros** (correo, nuevo integrante al workspace, nueva oportunidad, nueva respuesta
  de formulario, etc.) van a necesitar su propio diseño de card cuando se construyan — probablemente
  1 variante cada uno (a diferencia de Mensajería que necesita 4). No asumir que el layout de
  Mensajería sirve tal cual para todos; evaluar caso a caso qué campos tiene sentido mostrar.

## Pendiente

- Conectar `BellButton.tsx` a `GET /notification` + `GET /notification/unread-count` real.
- Escuchar el evento de socket correspondiente para que llegue en vivo (patrón `useEntityRealtime`).
- Agregar el hook de `createNotification` en el backend para mensajes entrantes (fuera de este repo).
- Diseñar las cards de los demás tipos de notificación a medida que se necesiten.
