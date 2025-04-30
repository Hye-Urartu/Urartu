import { prisma } from "@/lib/prisma";
import ResetForm from "./resetForm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let session = await prisma.passwordResetSession.findUnique({
    where: {
      id: (await searchParams).token as string,
    },
  });
  if (!session) return redirect("/request-password-reset");
  const csrfToken = (await headers()).get("X-CSRF-Token") || "missing";
  return (
    <ResetForm
      csrfToken={csrfToken}
      email={session.email}
      resetToken={session.id}
    />
  );
}
