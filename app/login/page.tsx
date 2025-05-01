import LoginForm from "./loginForm";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";
export default async function LogIn({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  if (!params.client_id) {
    return (
      <p className="mx-auto bg-black p-20 rounded-lg text-2xl font-semibold">
        Invalid Request
      </p>
    );
  }
  const csrfToken = (await headers()).get("X-CSRF-Token") || "missing";
  return <LoginForm csrf={csrfToken} />;
}
