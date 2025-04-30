import { NextRequest } from "next/server";
import { decode } from "jsonwebtoken";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const method = state?.split("-")[0];
  const csrf = (await headers()).get("X-CSRF-Token");
  console.log(csrf);
  console.log(state?.split("-")[1]);
  let user = {};
  if (method == "google") {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: request.nextUrl.searchParams.get("code"),
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.NEXT_PUBLIC_URI + "/callback",
      }),
    });
    const { id_token } = await res.json();
    const userData = decode(id_token);
    user = {
      email: userData.email,
      firstName: userData.given_name,
      lastName: userData.family_name,
      avatar: userData.picture,
      method: "google",
    };
  }
  console.log(user);
  return new Response(JSON.stringify(user), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
