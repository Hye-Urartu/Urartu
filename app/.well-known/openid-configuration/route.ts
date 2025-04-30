export const runtime = "edge";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_URI;
  const baseOauth = base + "/oauth";
  const baseOidc = base + "/oidc";
  return new Response(
    JSON.stringify({
      issuer: base,
      authorization_endpoint: base + "/authorize",
      token_endpoint: baseOauth + "/token",
      userinfo_endpoint: base + "/userinfo",
      mfa_challenge_endpoint: base + "/mfa/challenge",
      jwks_uri: base + "/.well-known/jwks.json",
      registration_endpoint: baseOidc + "/register",
      revocation_endpoint: baseOauth + "/revoke",
      scopes_supported: ["openid", "profile", "email"],
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      end_session_endpoint: baseOidc + "/logout",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, s-max-age=31536000",
      },
    }
  );
}
