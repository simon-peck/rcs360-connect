// app/routes/webhooks.app.scopes_update.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server"; // Use named import

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🚀 webhooks.app.scopes_update action started");
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current as string[];
  if (session) {
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        scope: current.toString(),
      },
    });
  }

  return new Response(null, { status: 200 });
};