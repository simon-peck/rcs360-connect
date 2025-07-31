// app/routes/api/authenticateShop.ts
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  console.log("🔑 Initializing Firebase Admin SDK");
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("❌ Firebase Admin SDK initialization failed:", error);
    throw error;
  }
}

const auth = getAuth();

export const action: ActionFunction = async ({ request }) => {
  console.log("🚀 authenticateShop action started");
  try {
    const body = await request.json();
    console.log("📥 Received request body:", body);

    const { shopDomain, shopOwnerEmail = "unknown@rcs360.co.uk" } = body;

    if (!shopDomain) {
      console.warn("⚠️ Missing shopDomain in request");
      return json({ error: "Missing shopDomain" }, { status: 400 });
    }

    if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
      console.warn("⚠️ Invalid shopDomain format:", shopDomain);
      return json({ error: "Invalid shopDomain format" }, { status: 400 });
    }

    const uid = `shop:${shopDomain}`;
    let user;

    try {
      console.log(`🔍 Attempting to get user with uid: ${uid}`);
      user = await auth.getUser(uid);
      console.log(`✅ User found: ${uid}`);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        console.log(`ℹ️ User not found. Creating user with uid: ${uid}`);
        user = await auth.createUser({
          uid,
          email: shopOwnerEmail,
        });
        console.log(`✅ Created user: ${uid}`);
      } else {
        console.error("🔥 Firebase Auth error:", err);
        return json({ error: err.message }, { status: 500 });
      }
    }

    console.log(`🔧 Setting custom claims for uid: ${user.uid}`);
    await auth.setCustomUserClaims(user.uid, { shopDomain });
    console.log("✅ Custom claims set");

    const updatedUser = await auth.getUser(user.uid);
    console.log("🔑 User custom claims:", updatedUser.customClaims);

    console.log(`🔑 Creating custom token for uid: ${user.uid}`);
    const token = await auth.createCustomToken(user.uid);
    console.log("✅ Custom token created");

    return json({ token }, { headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("🔥 Error in authenticateShop:", error);
    return json({ error: error.message || "Unknown error" }, { status: 500 });
  }
};

export const loader = async () => {
  return json({ error: "GET not supported" }, { status: 405 });
};