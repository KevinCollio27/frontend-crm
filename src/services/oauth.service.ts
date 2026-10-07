import api from "@/lib/api"

export interface OAuthRequest {
  client_id: string
  redirect_uri: string
  code_challenge: string
  scope: string
  state?: string
}

export interface OAuthClientInfo {
  name: string
  redirect_host: string
}

export const oauthService = {
  async client(request: OAuthRequest): Promise<OAuthClientInfo> {
    const res = await api.get<never, { client: OAuthClientInfo }>("oauth/client", {
      params: { client_id: request.client_id, redirect_uri: request.redirect_uri },
    })
    return res.client
  },

  // Devuelve la dirección del asistente a la que hay que volver, con el código o con el rechazo.
  async decide(request: OAuthRequest, decision: { approved: boolean; workspace_id?: number; can_write?: boolean }): Promise<string> {
    const res = await api.post<never, { redirect_to: string }>("oauth/approve", { ...request, ...decision })
    return res.redirect_to
  },
}
