import { prisma } from "@/lib/prisma";
import { DateTime } from "luxon";
import { NextRequest } from "next/server";
import jose from "node-jose";
import { JWK as jwkPrisma } from "@prisma/client";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.formData();

  if (body.get("grant_type") === "authorization_code") {
    function sha256(buffer: string) {
      return crypto.createHash("sha256").update(buffer).digest();
    }
    function base64URLEncode(str: Buffer) {
      return str
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    }
    const codeChallenge = base64URLEncode(
      sha256(body.get("code_verifier") as string)
    );
    const authCode = await prisma.userAuthCode.findUnique({
      where: {
        code: body.get("code") as string,
        AND: {
          clientId: body.get("client_id") as string,
          AND: {
            challenge: codeChallenge,
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
    if (!authCode) {
      return new Response("Invalid authorization code", { status: 400 });
    }
    if (DateTime.fromISO(authCode.expireAt.toISOString()) < DateTime.now()) {
      await prisma.userAuthCode.delete({
        where: {
          code: body.get("code") as string,
        },
      });
      return new Response("Authorization code expired", { status: 400 });
    }
    await prisma.userAuthCode.delete({
      where: {
        code: body.get("code") as string,
      },
    });
    const ks = ((await prisma.jWK.findFirst({})) as jwkPrisma).raw;
    const keyStore = await jose.JWK.asKeyStore(ks);
    const [key] = keyStore.all({ use: "sig" });
    const access_token = await jose.JWS.createSign(
      {
        compact: true,
        //jwk: key,
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
        //jwk: key,
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
        //jwk: key,
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
          ...authCode.user,
        })
      )
      .final();

    await prisma.userAuthToken.createMany({
      data: [
        {
          clientId: body.get("client_id") as string,
          expireAt: DateTime.now().plus({ minutes: 5 }).toUTC().toString(),
          // @ts-ignore
          token: access_token,
          type: "access_token",
          userId: authCode?.userId,
        },
        {
          clientId: body.get("client_id") as string,
          expireAt: DateTime.now().plus({ minutes: 60 }).toUTC().toString(),
          // @ts-ignore
          token: refresh_token,
          type: "refresh_token",
          userId: authCode?.userId,
        },
        {
          clientId: body.get("client_id") as string,
          expireAt: DateTime.now().plus({ minutes: 60 }).toUTC().toString(),
          // @ts-ignore
          token: id_token,
          type: "id_token",
          userId: authCode?.userId,
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
}
