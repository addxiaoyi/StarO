import { redirect } from "next/navigation";

export default async function ResetPasswordTokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ callbackURL?: string; callbackUrl?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const callbackURL = query.callbackURL || query.callbackUrl || "/reset-password";

  redirect(`/api/auth/reset-password/${encodeURIComponent(token)}?callbackURL=${encodeURIComponent(callbackURL)}`);
}
