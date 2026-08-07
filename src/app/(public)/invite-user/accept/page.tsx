import { InviteUserAcceptView } from "./_components/InviteUserAcceptView"

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function InviteUserAcceptPage({ searchParams }: Props) {
  const { token, email } = await searchParams
  return <InviteUserAcceptView token={token ?? ""} email={email ?? ""} />
}
