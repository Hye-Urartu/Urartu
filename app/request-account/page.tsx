import SignUpForm from "./signupForm";
import { headers } from "next/headers";

export default async function SignUp() {
  const csrfToken = (await headers()).get("X-CSRF-Token") || "missing";
  return <SignUpForm csrfToken={csrfToken} />;
}
