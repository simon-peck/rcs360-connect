// app/routes/api/authenticateShop.ts

import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import path from "path";
import { readFileSync } from "fs";

// Initialize Firebase Admin SDK (only once)
if (getApps().length === 0) {
  const serviceAccountPath = path.resolve("./firebase/serviceAccountKey.json");
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();

export const action: ActionFunction = async ({ request }) => {
  try {
    const body = await request.json();
    const { shopDomain, shopOwnerEmail = "unknown@rcs360.co.uk" } = body;

    if (!shopDomain) {
      return json({ error: "Missing shopDomain" }, { status: 400 });
    }

    const uid = `shop:${shopDomain}`;
    let user;

    try {
      user = await auth.getUser(uid);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        user = await auth.createUser({
          uid,
          email: shopOwnerEmail,
        });
      } else {
        console.error("🔥 Firebase Auth error:", err);
        return json({ error: err.message }, { status: 500 });
      }
    }

    await auth.setCustomUserClaims(user.uid, { shopDomain });

    const token = await auth.createCustomToken(user.uid);

    return json({ token });
  } catch (error: any) {
    console.error("🔥 Error in authenticateShop:", error);
    return json({ error: error.message || "Unknown error" }, { status: 500 });
  }
};

export const loader = async () => {
  return json({ error: "GET not supported" }, { status: 405 });
};

export default function AuthenticateShopRoute() {
  return null;
}