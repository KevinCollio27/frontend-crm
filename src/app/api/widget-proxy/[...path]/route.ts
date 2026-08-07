import { NextRequest, NextResponse } from "next/server"

// Proxy sin sesión para el widget público de contacto — a diferencia de
// /api/proxy (que inyecta el session_token de la cookie del usuario logueado),
// acá el "token" es el de la URL del widget (?token=...), que el visitante
// anónimo nunca tiene como cookie. Se reenvía tal cual venga en el header
// x-access-token del propio browser.
//
// Server-to-server hacia el backend no tiene problema de CORS (eso solo aplica
// a llamadas browser→backend) — evita depender de que el backend abra el header
// x-access-token para cualquier origen, que hoy no hace (openCors del backend
// solo permite Content-Type en /api/widget/*).
const API = process.env.API_URL!

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const endpoint = path.join("/")
  const token = req.headers.get("x-access-token")

  const target = new URL(`${API}/api/${endpoint}`)
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.append(k, v))

  const headers = new Headers({ "content-type": "application/json" })
  if (token) headers.set("x-access-token", token)

  let backendRes: Response
  try {
    backendRes = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
    })
  } catch (err) {
    console.error("[widget-proxy] Network error reaching backend:", err)
    return NextResponse.json({ success: false, message: "No se pudo conectar al servidor" }, { status: 503 })
  }

  let responseData: unknown
  try {
    responseData = await backendRes.json()
  } catch {
    console.error(`[widget-proxy] Backend returned non-JSON (status ${backendRes.status})`)
    return NextResponse.json({ success: false, message: "Respuesta inválida del servidor" }, { status: 502 })
  }

  return NextResponse.json(responseData, { status: backendRes.status })
}

export const GET = handler
export const POST = handler
