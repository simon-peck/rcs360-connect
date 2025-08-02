// app/routes/webhooks.app.uninstalled.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server"; // Use named import

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🚀 webhooks.app.uninstalled action started");
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await prisma.session.deleteMany({ where: { shop } });
  }

  return new Response(null, { status: 200 });
};