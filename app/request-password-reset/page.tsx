import ResetForm from "./resetForm";
import { headers } from "next/headers";

export default async function ResetPassword() {
  const csrfToken = (await headers()).get("X-CSRF-Token") || "missing";
  return <ResetForm csrfToken={csrfToken} />;
}
