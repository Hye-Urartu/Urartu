import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const params = Object.fromEntries(searchParams.entries());
  const session = await prisma.session.findFirst({
    where: {
      tokens: {
        some: {
          token: params.id_token as string,
        },
      },
    },
  });
  await prisma.session.delete({
    where: {
      id: session?.id,
    },
  });

  const response = new Response(null, {
    status: 302,
    headers: {
      location: searchParams.get("post_logout_redirect_uri") as string,
    },
  });
  return response;
}
