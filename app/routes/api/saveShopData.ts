// app/routes/api/saveShopData.ts
import type { LoaderFunctionArgs, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";

// Ensure Firebase is only initialized once
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")!,
    }),
  });
}

const db = getFirestore();

export const action: ActionFunction = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      shopDomain,
      shopName,
      host,
      customerCount,
      productCount,
      collectionCount,
      abandonedCartCount,
    } = body;

    if (!shopDomain) {
      return json({ error: "Missing shopDomain" }, { status: 400 });
    }

    const shopRef = db.collection("shops").doc(shopDomain);
    const now = new Date().toISOString();

    await shopRef.set({
      shopDomain,
      shopName,
      host,
      customerCount,
      productCount,
      collectionCount,
      abandonedCartCount,
      source: "shopify",
      lastSyncedAt: now,
      installedAt: now,
      lastDatabaseUpdateAt: now,
      lastShopifyResponse: {
        rawCounts: {
          customerCount,
          productCount,
          collectionCount,
          abandonedCartCount,
        },
        fetchedAt: now,
      },
      features: {
        abandonedCartExport: false,
        sinchIntegration: false,
        scheduledSync: false,
      },
      planName: "",
      exportHistory: [],
      scheduledTasks: [],
      shopOwnerEmail: "",
      dataHash: "",
    });

    return json({ success: true });
  } catch (error: any) {
    console.error("🔥 Error saving shop data:", error);
    return json({ error: error.message || "Unknown error" }, { status: 500 });
  }
};

export const loader = async () => {
  return json({ error: "GET not supported" }, { status: 405 });
};

export default function SaveShopDataRoute() {
  return null;
}