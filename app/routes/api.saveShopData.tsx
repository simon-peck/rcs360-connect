// app/routes/api.saveShopData.server.tsx
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { dbFirestore } from "../db.server";
import { firestore } from "firebase-admin"; // Added import for the Firestore type

const db = dbFirestore as firestore.Firestore; // Updated type assertion with imported Firestore type

export const action: ActionFunction = async ({ request }) => {
  console.log("🚀 saveShopData action started");
  try {
    const body = await request.json();
    console.log("📥 Received request body:", body);
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
      console.warn("⚠️ Missing shopDomain in request");
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

    console.log("✅ Shop data saved for:", shopDomain);
    return json({ success: true });
  } catch (error: any) {
    console.error("🔥 Error saving shop data:", error);
    return json({ error: error.message || "Unknown error" }, { status: 500 });
  }
};

export const loader = async () => {
  return json({ error: "GET not supported" }, { status: 405 });
};