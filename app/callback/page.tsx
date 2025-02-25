import { headers } from "next/headers";
import CallbackForm from "./callback";

export default async function Callback() {
  const csrfToken = (await headers()).get("X-CSRF-Token") || "missing";
  return <CallbackForm realCsrf={csrfToken} />;
}
