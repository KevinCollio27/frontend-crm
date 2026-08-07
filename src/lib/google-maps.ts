let loaderPromise: Promise<void> | null = null

/** Bootstrap loader oficial de Google (carga el script de Maps JS y habilita importLibrary). */
function loadBootstrap(apiKey: string): Promise<void> {
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Maps solo puede cargarse en el cliente"))
      return
    }
    if (window.google?.maps) {
      resolve()
      return
    }

    ;((g: Record<string, string>) => {
      let h: Promise<void> | undefined
      const m = document
      const w = window as unknown as Record<string, Record<string, unknown>>
      const c = "google"
      const b = (w[c] ??= {})
      const d = (b.maps ??= {}) as Record<string, unknown>
      const r = new Set<string>()
      const e = new URLSearchParams()
      const u = () =>
        h ||
        (h = new Promise<void>((res, rej) => {
          const script = m.createElement("script")
          e.set("libraries", [...r].join(","))
          for (const k in g) e.set(k.replace(/[A-Z]/g, (t) => "_" + t[0]!.toLowerCase()), g[k]!)
          e.set("callback", `${c}.maps.__ib__`)
          script.src = `https://maps.${c}apis.com/maps/api/js?${e}`
          d.__ib__ = res
          script.onerror = () => {
            h = undefined
            rej(new Error("No se pudo cargar Google Maps JavaScript API"))
          }
          m.head.append(script)
        }))
      d.importLibrary ??= (name: string) => {
        r.add(name)
        return u().then(() => (window.google!.maps!.importLibrary as (n: string) => Promise<unknown>)(name))
      }
    })({ key: apiKey, v: "weekly" } as unknown as Record<string, string>)

    window.google!.maps!.importLibrary("places").then(() => resolve(), reject)
  })

  return loaderPromise
}

export async function loadPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en el .env")
  await loadBootstrap(apiKey)
  return (await window.google!.maps!.importLibrary("places")) as google.maps.PlacesLibrary
}
