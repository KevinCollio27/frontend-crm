export interface MockContact {
  id: string
  name: string
  email: string
  organization: string
  createdAt: string
}

// Mock temporal — se reemplaza por contactService.list() cuando se conecte al backend.
export const MOCK_CONTACTS: MockContact[] = [
  { id: "1",  name: "Kevin Collio",    email: "kevin.collio@goxt.io",      organization: "GOXT",          createdAt: "2026-06-10" },
  { id: "2",  name: "Camila Rojas",    email: "c.rojas@andesretail.cl",    organization: "Andes Retail",  createdAt: "2026-06-02" },
  { id: "3",  name: "Diego Soto",      email: "diego@minera-x.cl",         organization: "Minera X",      createdAt: "2025-11-14" },
  { id: "4",  name: "Ana Pérez",       email: "ana.perez@logistic.cl",     organization: "LogiStar",      createdAt: "2025-08-22" },
  { id: "5",  name: "Felipe Muñoz",    email: "fmunoz@import.cl",          organization: "Import Co.",    createdAt: "2026-05-28" },
  { id: "6",  name: "Sofía Vargas",    email: "sofia@cadenaplus.cl",       organization: "Cadena Plus",   createdAt: "2025-03-05" },
  { id: "7",  name: "Matías Herrera",  email: "matias.herrera@falabella.cl", organization: "Falabella",   createdAt: "2026-06-14" },
  { id: "8",  name: "Valentina Reyes", email: "v.reyes@cencosud.cl",       organization: "Cencosud",      createdAt: "2024-12-01" },
  { id: "9",  name: "Joaquín Torres",  email: "jtorres@entel.cl",          organization: "Entel",         createdAt: "2026-05-30" },
  { id: "10", name: "Francisca Díaz",  email: "fdiaz@bci.cl",              organization: "BCI",           createdAt: "2025-06-19" },
  { id: "11", name: "Tomás Salinas",   email: "tsalinas@wom.cl",           organization: "WOM",           createdAt: "2024-09-09" },
  { id: "12", name: "Javiera Castro",  email: "jcastro@ripley.cl",         organization: "Ripley",        createdAt: "2026-06-05" },
]
