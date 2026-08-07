import api from "@/lib/api"
import type { CurrencyRaw } from "@/types/currency"

// Currencies almost never change — cache for 30 minutes + single-flight
const CURRENCY_TTL_MS = 30 * 60 * 1000
let currencyCache: { data: CurrencyRaw[]; expiresAt: number } | null = null
let currencyInFlight: Promise<CurrencyRaw[]> | null = null

export const currencyService = {
  async list(): Promise<CurrencyRaw[]> {
    const now = Date.now()

    if (currencyCache && now < currencyCache.expiresAt) {
      console.log("[currency] list() → cache hit")
      return currencyCache.data
    }

    if (currencyInFlight) {
      console.log("[currency] list() → in-flight, sharing promise")
      return currencyInFlight
    }

    const t0 = performance.now()
    currencyInFlight = api
      .get<never, { data: Array<{ id: number; name: string; symbol: string }> }>("currency")
      .then((res) => {
        const mapped = res.data.map((c) => ({ id: c.id, name: c.name, code: c.symbol }))
        currencyCache    = { data: mapped, expiresAt: Date.now() + CURRENCY_TTL_MS }
        currencyInFlight = null
        console.log(`[currency] list() → fetched ${mapped.length} currencies in ${(performance.now() - t0).toFixed(0)}ms`)
        return mapped
      })
      .catch((err) => {
        currencyInFlight = null
        throw err
      })

    return currencyInFlight
  },
}
