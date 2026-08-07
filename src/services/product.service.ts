import api from "@/lib/api"
import type { ProductLabelOptionRaw, ProductLabelRaw, ProductPage, ProductRaw } from "@/types/product"

export interface ProductListParams {
  page?:   number
  take?:   number
  filter?: string
}

export interface CanDeleteResult {
  canDelete: boolean
  message?: string
  opportunityCount?: number
}

// Products rarely change — cache 5 min + single-flight for the "all products" call used in wizards
const PRODUCT_TTL_MS = 5 * 60 * 1000
let productCache:    { data: ProductPage; expiresAt: number } | null = null
let productInFlight: Promise<ProductPage> | null                     = null

function invalidateProductCache() {
  productCache = null
  productInFlight = null
}

export const productService = {
  async list(params: ProductListParams = {}): Promise<ProductPage> {
    const res = await api.get<never, { products: ProductPage }>("product", { params })
    return res.products
  },

  async listAll(): Promise<ProductPage> {
    const now = Date.now()

    if (productCache && now < productCache.expiresAt) {
      console.log("[product] listAll() → cache hit")
      return productCache.data
    }

    if (productInFlight) {
      console.log("[product] listAll() → in-flight, sharing promise")
      return productInFlight
    }

    const t0 = performance.now()
    productInFlight = api
      .get<never, { products: ProductPage }>("product", { params: { take: 100 } })
      .then((res) => {
        productCache    = { data: res.products, expiresAt: Date.now() + PRODUCT_TTL_MS }
        productInFlight = null
        console.log(`[product] listAll() → fetched ${res.products.data.length} products in ${(performance.now() - t0).toFixed(0)}ms`)
        return res.products
      })
      .catch((err) => {
        productInFlight = null
        throw err
      })

    return productInFlight
  },

  async getById(id: number): Promise<ProductRaw> {
    const res = await api.get<never, { data: ProductRaw }>(`product/${id}`)
    return res.data
  },

  async create(params: { name: string }): Promise<ProductRaw> {
    const res = await api.post<never, { product: ProductRaw }>("product", { name: params.name })
    invalidateProductCache()
    return res.product
  },

  async update(id: number, params: { name: string }): Promise<ProductRaw> {
    const res = await api.put<never, { data: ProductRaw }>(`product/${id}`, { name: params.name })
    invalidateProductCache()
    return res.data
  },

  async duplicate(id: number): Promise<ProductRaw> {
    const res = await api.post<never, { product: ProductRaw }>(`product/${id}/duplicate`)
    invalidateProductCache()
    return res.product
  },

  async delete(id: number): Promise<void> {
    await api.delete(`product/${id}`)
    invalidateProductCache()
  },

  async checkCanDelete(id: number): Promise<CanDeleteResult> {
    try {
      await api.get(`product/${id}/can-delete`)
      return { canDelete: true }
    } catch (error) {
      const e = error as { message?: string; opportunityCount?: number }
      return { canDelete: false, message: e.message, opportunityCount: e.opportunityCount }
    }
  },

  async createLabel(params: { name: string; key: string; type: string; productId: number; orderNumber: number; isConditional?: boolean }): Promise<ProductLabelRaw> {
    const res = await api.post<never, { productLabel: ProductLabelRaw }>("product/label", {
      name: params.name,
      key: params.key,
      type: params.type,
      product_id: params.productId,
      order_number: params.orderNumber,
      is_conditional: params.isConditional ?? false,
    })
    invalidateProductCache()
    return res.productLabel
  },

  async updateLabel(id: number, params: { name: string; key: string; type: string; productId: number; orderNumber: number; isConditional?: boolean }): Promise<ProductLabelRaw> {
    const res = await api.put<never, { productLabel: ProductLabelRaw }>(`product/label/${id}`, {
      name: params.name,
      key: params.key,
      type: params.type,
      product_id: params.productId,
      order_number: params.orderNumber,
      is_conditional: params.isConditional ?? false,
    })
    invalidateProductCache()
    return res.productLabel
  },

  async deleteLabel(id: number): Promise<void> {
    await api.delete(`product/label/${id}`)
    invalidateProductCache()
  },

  async updateManyLabels(labels: { id: number; orderNumber: number }[]): Promise<void> {
    await api.post("product/label/update-many", labels.map((l) => ({ id: l.id, order_number: l.orderNumber })))
    invalidateProductCache()
  },

  async createLabelOption(params: { value: string; orderNumber: number; productLabelId: number }): Promise<ProductLabelOptionRaw> {
    const res = await api.post<never, { data: ProductLabelOptionRaw }>("product/label/option", {
      value: params.value,
      order_number: params.orderNumber,
      product_label_id: params.productLabelId,
    })
    invalidateProductCache()
    return res.data
  },

  async updateLabelOption(id: number, params: { value: string; orderNumber: number; productLabelId: number }): Promise<ProductLabelOptionRaw> {
    const res = await api.put<never, { data: ProductLabelOptionRaw }>(`product/label/option/${id}`, {
      value: params.value,
      order_number: params.orderNumber,
      product_label_id: params.productLabelId,
    })
    invalidateProductCache()
    return res.data
  },

  async deleteLabelOption(id: number): Promise<void> {
    await api.delete(`product/label/option/${id}`)
    invalidateProductCache()
  },

  async updateManyOptions(options: { id: number; orderNumber: number }[]): Promise<void> {
    await api.post("product/label/option/update-many", options.map((o) => ({ id: o.id, order_number: o.orderNumber })))
    invalidateProductCache()
  },
}
