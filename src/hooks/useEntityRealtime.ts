"use client"

import { useEffect, useRef } from "react"
import { getSocket } from "@/lib/socket"
import { useSessionStore } from "@/store/session.store"

type CrudAction = "created" | "updated" | "deleted" | "moved"

export interface CrudEventPayload<T = unknown> {
  entity: string
  action: CrudAction
  data: T
  timestamp: string
  actorId?: number | string
}

const CRUD_ACTIONS: CrudAction[] = ["created", "updated", "deleted", "moved"]

// Escucha los eventos CRUD en tiempo real de una entidad (organization,
// person, opportunity, ...) dentro del workspace activo. El backend ya los
// emite vía SocketService.notifyCrudAction — este hook solo se suscribe y
// avisa; decide qué hacer con el evento (normalmente: refrescar la tabla).
//
// Ignora por defecto los eventos disparados por el propio usuario (su UI ya
// se actualiza sola tras su propia acción) — pasa `includeSelf: true` si
// necesitas lo contrario.
export function useEntityRealtime(
  entity: string,
  onEvent: (payload: CrudEventPayload) => void,
  options?: { includeSelf?: boolean }
) {
  const workspaceId = useSessionStore((s) => s.workspaceId)
  const userId = useSessionStore((s) => s.user?.id)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!workspaceId) return
    const socket = getSocket()
    socket.emit("join-workspace-room", String(workspaceId))

    const handlers = CRUD_ACTIONS.map((action) => {
      const eventName = `${entity}:${action}`
      const handler = (payload: CrudEventPayload) => {
        if (!options?.includeSelf && userId && String(payload.actorId) === String(userId)) return
        onEventRef.current(payload)
      }
      socket.on(eventName, handler)
      return { eventName, handler }
    })

    return () => {
      handlers.forEach(({ eventName, handler }) => socket.off(eventName, handler))
    }
  }, [entity, workspaceId, userId, options?.includeSelf])
}
