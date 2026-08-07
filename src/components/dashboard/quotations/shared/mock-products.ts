import type { ProductLabelRaw, ProductRaw } from "@/types/product"

// Mock temporal — se reemplaza por productService.list() cuando se conecte al backend.
// Volumen/variedad inspirados en un cliente real (transporte marítimo) para probar
// la UI con varios productos y varias etiquetas por producto.

let _id = 0
const nextId = () => ++_id

function selectLabel(name: string, key: string, options: string[], isConditional = false): ProductLabelRaw {
  return {
    id: nextId(),
    name,
    key,
    type: "select",
    order_number: null,
    is_conditional: isConditional,
    product_label_option: options.map((value) => ({ id: nextId(), value, order_number: null })),
  }
}

function numberLabel(name: string, key: string): ProductLabelRaw {
  return { id: nextId(), name, key, type: "number", order_number: null, is_conditional: false, product_label_option: [] }
}

function textLabel(name: string, key: string): ProductLabelRaw {
  return { id: nextId(), name, key, type: "text", order_number: null, is_conditional: false, product_label_option: [] }
}

function dateLabel(name: string, key: string): ProductLabelRaw {
  return { id: nextId(), name, key, type: "date", order_number: null, is_conditional: false, product_label_option: [] }
}

// ─── Etiquetas reutilizadas entre productos marítimos ──────────────────────────

const navesLabel = () => selectLabel("Naves", "naves", ["Nave Esperanza", "Nave Polaris", "Nave Austral"])
const lugarServicioLabel = () =>
  selectLabel("Lugar de Servicio", "lugar_servicio", ["Puerto Valparaíso", "Puerto San Antonio", "Fondeo"])
const fechaTentativaLabel = () => dateLabel("Fecha Tentativa", "fecha_tentativa")

function product(name: string, product_label: ProductLabelRaw[]): ProductRaw {
  return { id: nextId(), name, created_at: "", updated_at: "", workspace_id: null, is_deleted: false, product_label }
}

export const MOCK_PRODUCTS: ProductRaw[] = [
  product("Transporte Terrestre", [
    textLabel("Origen", "origen"),
    textLabel("Destino", "destino"),
    selectLabel("Tipo Camión", "tipo_camion", ["Camión 3/4", "Rampla", "Camioneta"]),
    selectLabel("Rendiciones", "rendiciones", ["Sí", "No"]),
    selectLabel("Ayudante", "ayudante", ["Sí", "No"]),
  ]),
  product("Merpel", [
    navesLabel(),
    lugarServicioLabel(),
    selectLabel("Tipo Merpel", "tipo_merpel", ["Tipo A", "Tipo B", "Tipo C"]),
    fechaTentativaLabel(),
  ]),
  product("Combustible", [
    navesLabel(),
    lugarServicioLabel(),
    numberLabel("Lts", "lts"),
    fechaTentativaLabel(),
  ]),
  product("Peróxido", [
    navesLabel(),
    lugarServicioLabel(),
    numberLabel("Isotanques", "isotanques"),
    fechaTentativaLabel(),
  ]),
  product("Redes", [
    navesLabel(),
    lugarServicioLabel(),
    numberLabel("Contenedores", "contenedores"),
    selectLabel("Tipo Redes", "tipo_redes", ["Red de Cerco", "Red de Arrastre", "Red de Enmalle"]),
    selectLabel("Requiere Virador", "requiere_virador", ["Sí", "No"], true),
    selectLabel("Uso extra winche", "uso_extra_winche", ["Sí", "No"], true),
    fechaTentativaLabel(),
  ]),
  product("Cabotaje", [
    navesLabel(),
    lugarServicioLabel(),
    numberLabel("Tons", "tons"),
    numberLabel("Contenedores", "contenedores"),
    fechaTentativaLabel(),
  ]),
  product("Alimento", [
    navesLabel(),
    lugarServicioLabel(),
    numberLabel("Tons", "tons"),
    fechaTentativaLabel(),
    textLabel("destino", "destino"),
  ]),
]
