// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { DateTime } from "luxon";
import { NextRequest } from "next/server";
import jose from "node-jose";
import { JWKS } from "@prisma/client";
export const runtime = "edge";

export async function POST(request: NextRequest) {
  const body = await request.formData();

  if (body.get("grant_type") === "authorization_code") {
    const authCode = await prisma.userAuthorizationCode.findUnique({
      where: {
        code: body.get("code") as string,
        AND: {
          clientId: body.get("client_id") as string,
          AND: {
            verifier: body.get("code_verifier") as string,
          },
        },
      },
      include: {
        user: {
          omit: {
            password: true,
          },
        },
      },
    });
    if (DateTime.fromISO(authCode?.expireAt as any) < DateTime.now()) {
      await prisma.userAuthorizationCode.delete({
        where: {
          code: body.get("code") as string,
        },
      });
      return new Response("Authorization code expired", { status: 400 });
    }
    await prisma.userAuthorizationCode.delete({
      where: {
        code: body.get("code") as string,
      },
    });
    const ks = ((await prisma.jWKS.findFirst({})) as JWKS).key;
    const keyStore = await jose.JWK.asKeyStore(ks);
    const [key] = keyStore.all({ use: "sig" });
    const access_token = await jose.JWS.createSign(
      {
        compact: true,
        jwk: key,
        fields: {
          typ: "jwt",
        },
      },
      key
    )
      .update(
        JSON.stringify({
          sub: authCode?.userId,
          iss: process.env.URI + "/auth",
          aud: body.get("client_id") as string,
          exp: DateTime.now().plus({ minutes: 5 }).toSeconds(),
          iat: DateTime.now().toSeconds(),
        })
      )
      .final();
    const refresh_token = await jose.JWS.createSign(
      {
        compact: true,
        jwk: key,
        fields: {
          typ: "jwt",
        },
      },
      key
    )
      .update(
        JSON.stringify({
          sub: authCode?.userId,
          iss: process.env.URI + "/auth",
          aud: body.get("client_id") as string,
          exp: DateTime.now()
            .plus({ minutes: 1 * 60 })
            .toSeconds(),
          iat: DateTime.now().toSeconds(),
        })
      )
      .final();
    const id_token = await jose.JWS.createSign(
      {
        compact: true,
        jwk: key,
        fields: {
          typ: "jwt",
        },
      },
      key
    )
      .update(
        JSON.stringify({
          exp: DateTime.now()
            .plus({ minutes: 1 * 60 })
            .toSeconds(),
          sub: authCode?.userId,
          iss: process.env.URI + "/auth",
          ...authCode?.user,
        })
      )
      .final();

    await prisma.userAuthToken.createMany({
      data: [
        {
          clientId: body.get("client_id") as string,
          expireAt: DateTime.now().plus({ minutes: 5 }).toUTC().toString(),
          token: access_token,
          type: "access_token",
          userId: authCode?.userId as string,
        },
        {
          clientId: body.get("client_id") as string,
          expireAt: DateTime.now().plus({ minutes: 60 }).toUTC().toString(),
          token: refresh_token,
          type: "refresh_token",
          userId: authCode?.userId as string,
        },
        {
          clientId: body.get("client_id") as string,
          expireAt: DateTime.now().plus({ minutes: 60 }).toUTC().toString(),
          token: id_token,
          type: "id_token",
          userId: authCode?.userId as string,
        },
      ],
    });
    return new Response(
      JSON.stringify({
        access_token,
        refresh_token,
        id_token,
        token_type: "bearer",
        expires_in: 3600,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
  //
}
