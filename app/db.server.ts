import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

declare global {
  var prismaGlobal: PrismaClient;
}

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

let firestore: FirebaseFirestore.Firestore;

if (!getApps().length) {
  const serviceAccount = JSON.parse(
    readFileSync("./serviceAccountKey.json", "utf8")
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

firestore = getFirestore();

export default prisma;
export { firestore };
