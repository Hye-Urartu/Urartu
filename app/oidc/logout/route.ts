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
  console.log(session);
}
