import jose from "node-jose";
import { prisma } from "../../../lib/prisma";

export const runtime = "edge";
export async function GET() {
  console.time("e");
  let jwks = await prisma.jWKS.findFirst();
  console.timeEnd("e");
  console.log(jwks);
  if (!jwks) {
    const keystore = jose.JWK.createKeyStore();
    let jwksSig = await keystore.generate("RSA", 2048, {
      alg: "RS256",
      use: "sig",
    });

    jwks = await prisma.jWKS.create({
      data: {
        key: JSON.stringify({ keys: [jwksSig.toJSON(true)] }),
      },
    });
  }

  return new Response(
    JSON.stringify((await jose.JWK.asKeyStore(jwks.key)).toJSON(false)),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, s-max-age=31536000",
      },
    }
  );
}
