import { InviteLinkView } from "./_components/InviteLinkView"

interface Props {
  params: Promise<{ code: string }>
}

export default async function InviteLinkPage({ params }: Props) {
  const { code } = await params
  return <InviteLinkView code={code} />
}
