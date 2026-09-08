// Cache con TTL + single-flight para servicios que reciben params — mismo patrón que ya
// usan flow.service.ts/currency.service.ts (sin params), extendido para params variables:
// cada combinación de params tiene su propia entrada, así que llamadas con distinto
// flowId/datePreset no se pisan entre sí.
export function createParamCache<P, T>(fetcher: (params: P) => Promise<T>, ttlMs: number) {
  const cache = new Map<string, { data: T; expiresAt: number }>()
  const inFlight = new Map<string, Promise<T>>()

  function keyOf(params: P): string {
    return JSON.stringify(params ?? {})
  }

  async function get(params: P): Promise<T> {
    const key = keyOf(params)
    const now = Date.now()

    const cached = cache.get(key)
    if (cached && now < cached.expiresAt) return cached.data

    const pending = inFlight.get(key)
    if (pending) return pending

    const promise = fetcher(params)
      .then((data) => {
        cache.set(key, { data, expiresAt: Date.now() + ttlMs })
        inFlight.delete(key)
        return data
      })
      .catch((err) => {
        inFlight.delete(key)
        throw err
      })

    inFlight.set(key, promise)
    return promise
  }

  function invalidate() {
    cache.clear()
    inFlight.clear()
  }

  return { get, invalidate }
}
