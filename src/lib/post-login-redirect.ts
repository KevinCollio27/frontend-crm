const KEY = "post_login_redirect"

// Solo rutas internas que necesitan sesión para continuar un flujo iniciado fuera del CRM.
const ALLOWED_PREFIXES = ["/oauth/authorize"]

export function savePostLoginRedirect(path: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(KEY, path)
}

/** Devuelve la ruta pendiente y la olvida. null si no hay ninguna o no es una ruta permitida. */
export function takePostLoginRedirect(): string | null {
  if (typeof window === "undefined") return null
  const path = sessionStorage.getItem(KEY)
  sessionStorage.removeItem(KEY)
  return path && ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix)) ? path : null
}
