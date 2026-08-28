"use client"

import * as React from "react"

// Con el scrollbar oculto (scrollbar-hide) no queda ninguna pista visual de que hay más
// contenido abajo — este hook la reemplaza por un booleano (para mostrar/ocultar un botón
// de "bajar") + una función que avanza el scroll de a un paso (una fila aprox.), en vez de
// saltar directo al final. `deps` se revisa cada vez que cambia la lista (ej. al cargar
// más filas), ya que el contenedor en sí no cambia de tamaño (altura fija) aunque su
// contenido sí crezca.
// El umbral (32px) no es "pixel perfecto al fondo" a propósito — el botón "Cargar más"
// agrega su propio padding después de la última fila, así que sin este margen la flecha
// seguía visible con el botón ya a la vista (los dos superpuestos).
const BOTTOM_THRESHOLD = 32

export function useScrollHint<T extends HTMLElement>(deps: React.DependencyList) {
  const ref = React.useRef<T>(null)
  const [canScrollDown, setCanScrollDown] = React.useState(false)

  const check = React.useCallback(() => {
    const el = ref.current
    setCanScrollDown(!!el && el.scrollHeight - el.scrollTop - el.clientHeight > BOTTOM_THRESHOLD)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { check() }, deps)

  function scrollStep() {
    ref.current?.scrollBy({ top: 96, behavior: "smooth" })
  }

  // `onScroll` se pasa directo al div (en vez de addEventListener en un efecto aparte) —
  // el contenedor real solo existe una vez terminó de cargar (antes se muestra un
  // skeleton), así que un efecto que engancha el listener una sola vez al montar el hook
  // llegaba tarde: encontraba el ref todavía en null y nunca se reenganchaba después. El
  // prop de React no tiene ese problema de timing.
  return { ref, canScrollDown, scrollStep, onScroll: check }
}
