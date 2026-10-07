import { OAuthConsentView } from "./_components/OAuthConsentView"

interface Props {
  searchParams: Promise<{ client_id?: string; redirect_uri?: string; code_challenge?: string; scope?: string; state?: string }>
}

export default async function OAuthAuthorizePage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <OAuthConsentView
      request={{
        client_id: params.client_id ?? "",
        redirect_uri: params.redirect_uri ?? "",
        code_challenge: params.code_challenge ?? "",
        scope: params.scope ?? "",
        state: params.state,
      }}
    />
  )
}
