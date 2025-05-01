import { prisma } from "@/lib/prisma";
import ResetForm from "./resetForm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  if (!params.token) {
    return redirect("/request-password-reset");
  }
  let session = await prisma.passwordResetSession.findUnique({
    where: {
      id: params.token as string,
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });
  if (!session) return redirect("/request-password-reset");
  const csrfToken = (await headers()).get("X-CSRF-Token") || "missing";
  return (
    <ResetForm
      csrfToken={csrfToken}
      email={session.user.email}
      resetToken={session.id}
    />
  );
}
