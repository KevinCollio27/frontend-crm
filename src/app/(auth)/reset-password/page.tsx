import ResetPassword from "@/components/auth/ResetPassword";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return <ResetPassword token={token ?? ""} />;
}
