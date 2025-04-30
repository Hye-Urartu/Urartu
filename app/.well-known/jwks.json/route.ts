import jose from "node-jose";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  let jwks = await prisma.jWK.findFirst();

  if (!jwks) {
    const keystore = jose.JWK.createKeyStore();
    let jwksSig = await keystore.generate("RSA", 2048, {
      alg: "RS256",
      use: "sig",
    });

    jwks = await prisma.jWK.create({
      data: {
        raw: JSON.stringify({ keys: [jwksSig.toJSON(true)] }),
      },
    });
  }

  return new Response(
    JSON.stringify((await jose.JWK.asKeyStore(jwks.raw)).toJSON(false)),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, s-max-age=31536000",
      },
    }
  );
}
