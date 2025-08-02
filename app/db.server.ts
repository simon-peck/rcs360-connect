// app/db.server.ts
import { PrismaClient } from "@prisma/client";
import admin from "firebase-admin";

console.log("🔧 Starting db.server.ts initialization");

// Prisma setup
let prisma: PrismaClient;
declare global {
  var prismaGlobal: PrismaClient | undefined;
}
if (process.env.NODE_ENV !== "production") {
  console.log("🔧 Non-production environment detected");
  if (!global.prismaGlobal) {
    console.log("🔧 Creating new PrismaClient instance (global)");
    global.prismaGlobal = new PrismaClient();
  } else {
    console.log("🔧 Reusing existing global PrismaClient instance");
  }
  prisma = global.prismaGlobal;
} else {
  console.log("🔧 Creating new PrismaClient instance (production)");
  prisma = new PrismaClient();
}

console.log("🔧 PrismaClient instance ready");

// Firebase setup
console.log("🔧 Checking existing Firebase apps - in db.server.ts");
//let dbFirestore: Firestore | undefined;
let dbFirestore: ReturnType<typeof admin.firestore> | undefined;

if (!admin.apps.length) {
  console.log("🔧 No Firebase app found, initializing Firebase Admin");
  console.log("🔍 Checking Firebase environment variables:");
  console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
  console.log("FIREBASE_PRIVATE_KEY present:", !!process.env.FIREBASE_PRIVATE_KEY);
  console.log("FIREBASE_PRIVATE_KEY length:", process.env.FIREBASE_PRIVATE_KEY?.length);
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("🔧 Firebase Admin initialized");
    dbFirestore = admin.firestore(); // Use admin.firestore() directly
    console.log("🔧 Firestore instance acquired");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error);
    throw new Error("Failed to initialize Firebase Admin: " + (error instanceof Error ? error.message : String(error)));
  }
} else {
  console.log("🔧 Firebase Admin app already initialized");
  dbFirestore = admin.firestore(); // Reuse existing app
  console.log("🔧 Firestore instance acquired");
}

if (!dbFirestore) {
  throw new Error("Firestore instance not initialized");
}

export { prisma, dbFirestore };