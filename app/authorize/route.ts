import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import { DateTime } from "luxon";
import { Md5 } from "ts-md5";
import crypto from "crypto";
import { decode } from "jsonwebtoken";

async function generateAuthorizationCode(
  userId: string,
  verifier: string,
  clientId: string
) {
  const expiration = 5 * 60;
  const authObject = {
    authorizationUserId: userId,
    authorizationExpireAt: DateTime.now()
      .plus({ seconds: expiration })
      .toUTC()
      .toString(),
  };
  const authorizationCode = Md5.hashStr(JSON.stringify(authObject));
  console.log(userId);
  await prisma.userAuthCode.deleteMany({
    where: {
      userId: userId,
    },
  });
  await prisma.userAuthCode.create({
    data: {
      code: authorizationCode,
      verifier: verifier,
      client: {
        connect: {
          id: clientId,
        },
      },
      expireAt: authObject.authorizationExpireAt,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
  return authorizationCode;
}

export async function POST(request: NextRequest) {
  const searchParams = new URL(request.nextUrl).searchParams;

  if (searchParams.get("csrf")) {
    let csrf = searchParams.get("csrf");
    let method = csrf?.split("-")[0];
    let client_id = csrf?.split("-")[2];
    console.log(client_id);
    let user;
    if (method == "google") {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: request.nextUrl.searchParams.get("code"),
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.NEXT_PUBLIC_URI + "/callback",
        } as any),
      });
      const { id_token } = await res.json();
      const userData = decode(id_token) as {
        sub: string;
        email: string;
        given_name: string;
        family_name: string;
        picture: string;
      };
      user = {
        sub: userData?.sub,
        email: userData?.email,
        firstName: userData?.given_name,
        lastName: userData?.family_name,
        avatar: userData?.picture,
        method: "google",
      };
      console.log(user);
    }
    if (method == "github") {
      const res = await fetch(`https://github.com/login/oauth/access_token`, {
        method: "POST",
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: request.nextUrl.searchParams.get("code"),
          redirect_uri: process.env.NEXT_PUBLIC_URI + "/callback",
        } as any),
      });
      const dat = await res.text();

      const res2 = await fetch(`https://api.github.com/user`, {
        headers: {
          Authorization: `token ${new URLSearchParams(dat).get(
            "access_token"
          )}`,
        },
      });
      const userData = await res2.json();
      user = {
        sub: userData.id.toString(),
        email: userData.email,
        firstName: userData.name.split(" ")[0],
        lastName: userData.name.split(" ")[1],
        avatar: userData.avatar_url,
        method: "github",
      };
      console.log(user);
    }
    if (method == "discord") {
      const res = await fetch(`https://discord.com/api/v9/oauth2/token`, {
        method: "POST",
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          code: request.nextUrl.searchParams.get("code"),
          redirect_uri: process.env.NEXT_PUBLIC_URI + "/callback",
          grant_type: "authorization_code",
          scope: "identify email",
        } as any),
      });
      const dat = await res.json();
      const res2 = await fetch(`https://discord.com/api/v9/users/@me`, {
        headers: {
          Authorization: `Bearer ${dat.access_token}`,
        },
      });
      const userData = await res2.json();
      user = {
        sub: userData.id,
        email: userData.email,
        firstName: userData.username,
        lastName: userData.discriminator,
        avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
        method: "discord",
      };
      console.log(user);
    }
    let userData = await prisma.user.findUnique({
      where: {
        email: user?.email,
        AND: {
          authMethod: user?.method,
        },
      },
    });
    if (!userData) {
      userData = await prisma.user.create({
        data: {
          id: user?.sub,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          avatar: user?.avatar,
          authMethod: user?.method as string,
        },
      });
    }
    const code = await generateAuthorizationCode(
      userData.id,
      csrf?.split("-")[2] as string,
      client_id as string
    );
    return NextResponse.redirect(csrf?.split("-")[3] + `?code=${code}`);
  }
  if (
    searchParams.get("redirect_uri") !=
    process.env.NEXT_PUBLIC_URI + "/callback"
  ) {
    return new Response("Invalid redirect_uri", { status: 400 });
  }

  const body = await request.formData();
  if (!body.get("captcha")) {
    return new Response("Captcha is required", { status: 400 });
  }
  const cap = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: body.get("captcha") as string,
    } as any),
  });
  let capData = await cap.json();
  if (!capData.success)
    return new Response("Failed to verify humanity", { status: 400 });

  console.log(body, "this is the body");
  console.log(searchParams, "search params");
  let user;
  try {
    user = await prisma.user.findUnique({
      where: {
        email: body.get("email") as string,
        AND: {
          authMethod: "urartu",
        },
      },
      select: {
        password: true,
        id: true,
      },
    });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }

  const pass = await argon2.hash(body.get("password") as string);
  console.log(pass);
  let valid = await argon2.verify(
    user?.password as string,
    body.get("password") as string
  );
  if (!valid) {
    return new Response("Invalid email or password", { status: 401 });
  }
  const code = await generateAuthorizationCode(
    user?.id as string,
    request.cookies.get("code_verifier")?.value as string,
    "ararat" // URA-15 multiple clients support
  );
  return NextResponse.redirect(
    searchParams.get("redirect_uri") + `?code=${code}`
  );
}

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.nextUrl).searchParams;
  console.log(searchParams.get("csrf"));
  if (searchParams.get("csrf")) {
    return await POST(request);
  }
  function base64URLEncode(str: Buffer) {
    return str
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));

  function sha256(buffer: string) {
    return crypto.createHash("sha256").update(buffer).digest();
  }
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  return new Response(null, {
    status: 302,
    headers: {
      location:
        process.env.NEXT_PUBLIC_URI +
        `/login${request.nextUrl.search}&code_challenge=${codeChallenge}&code_challenge_method=S256`,
      "Set-Cookie": `code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=Strict;`,
    },
  });
}
