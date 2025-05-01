import { prisma } from "@/lib/prisma";
import SignUpForm from "./signupForm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  if (!params.token) {
    return redirect("/request-account");
  }

  let session = await prisma.signupSession.findUnique({
    where: {
      id: params.token as string,
    },
  });
  if (!session) return redirect("/request-account");
  const csrfToken = (await headers()).get("X-CSRF-Token") || "missing";
  return (
    <SignUpForm
      csrfToken={csrfToken}
      email={session.email}
      registrationToken={session.id}
    />
  );
}
