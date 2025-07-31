import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient;
}

console.log("🔧 Starting db.server.ts initialization");

if (process.env.NODE_ENV !== "production") {
  console.log("🔧 Non-production environment detected");
  if (!global.prismaGlobal) {
    console.log("🔧 Creating new PrismaClient instance (global)");
    global.prismaGlobal = new PrismaClient();
  } else {
    console.log("🔧 Reusing existing global PrismaClient instance");
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();
console.log("🔧 PrismaClient instance ready");

let firestore: FirebaseFirestore.Firestore;

console.log("🔧 Checking existing Firebase apps - in db.server.ts");
if (!getApps().length) {
  console.log("🔧 No Firebase app found, initializing Firebase Admin");
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
  console.log("🔧 Firebase Admin initialized");
} else {
  console.log("🔧 Firebase Admin app already initialized");
}

firestore = getFirestore();
console.log("🔧 Firestore instance acquired");

export default prisma;
export { firestore };
