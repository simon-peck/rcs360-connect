import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  console.log("🛡️ Admin authentication completed");

  const query = `
    query {
      shop {
        name
        myshopifyDomain
      }
      customersCount {
        count
      }
      productsCount {
        count
      }
      collectionsCount {
        count
      }
      abandonedCheckoutsCount {
        count
      }
    }
  `;

  try {
    console.log("📡 Sending GraphQL query:", query);
    const response = await admin.graphql(query);
    console.log("📨 GraphQL response received, status:", response.status, response.statusText);
    const data = await response.json();
    console.log("🐞 Raw GraphQL data:", JSON.stringify(data, null, 2));

    if (!data || !data.data) {
      console.error("🚫 No data received in GraphQL response");
      throw new Error("No data in response");
    }

    if ("errors" in data && data.errors) {
      console.error("🔥 GraphQL Errors:", JSON.stringify(data.errors, null, 2));
      throw new Error(`GraphQL query failed: ${JSON.stringify(data.errors)}`);
    }

    const shopData = data.data?.shop;
    if (!shopData) {
      console.error("🔥 No shop data returned from GraphQL");
      throw new Error("No shop data available");
    }

    const shopName = shopData.name || "Unknown Shop";
    const shopDomain = shopData.myshopifyDomain || new URL(request.url).searchParams.get("shop") || "unknown.myshopify.com";
    const shopId = shopDomain;
    const customerCount = data.data?.customersCount?.count || 0;
    const productCount = data.data?.productsCount?.count || 0;
    const collectionCount = data.data?.collectionsCount?.count || 0;
    const abandonedCartCount = data.data?.abandonedCheckoutsCount?.count || 0;

    console.log("👥 Customer Count:", customerCount);
    console.log("📦 Product Count:", productCount);
    console.log("🗂️ Collection Count:", collectionCount);
    console.log("🛒 Abandoned Cart Count:", abandonedCartCount);

    const flutterUrl = new URL("https://app.rcs360.co.uk");
    flutterUrl.searchParams.set("shop", encodeURIComponent(shopId));
    flutterUrl.searchParams.set("shopName", encodeURIComponent(shopName));
    flutterUrl.searchParams.set("shopDomain", encodeURIComponent(shopDomain));
    flutterUrl.searchParams.set("customerCount", encodeURIComponent(customerCount.toString()));
    flutterUrl.searchParams.set("productCount", encodeURIComponent(productCount.toString()));
    flutterUrl.searchParams.set("collectionCount", encodeURIComponent(collectionCount.toString()));
    flutterUrl.searchParams.set("abandonedCartCount", encodeURIComponent(abandonedCartCount.toString()));

    let hostParam = new URL(request.url).searchParams.get("host");
    if (hostParam) {
      if (hostParam.length % 4 !== 0) {
        hostParam = hostParam.padEnd(Math.ceil(hostParam.length / 4) * 4, "=");
      }
      flutterUrl.searchParams.set("host", encodeURIComponent(hostParam));
    }

    console.log("🔗 Flutter URL:", flutterUrl.toString());
    console.log("🔗 Shop ID:", shopId);
    console.log("🔗 Shop Name:", shopName);
    console.log("🔗 Shop Domain:", shopDomain);

    return redirect(flutterUrl.toString());
  } catch (error) {
    console.error("🔥 Error in loader:", error);
    const shopDomain = new URL(request.url).searchParams.get("shop") || "unknown.myshopify.com";
    const shopName = "Unknown Shop";
    const shopId = shopDomain;
    const customerCount = 0;
    const productCount = 0;
    const collectionCount = 0;
    const abandonedCartCount = 0;

    const flutterUrl = new URL("https://app.rcs360.co.uk");
    flutterUrl.searchParams.set("shop", encodeURIComponent(shopId));
    flutterUrl.searchParams.set("shopName", encodeURIComponent(shopName));
    flutterUrl.searchParams.set("shopDomain", encodeURIComponent(shopDomain));
    flutterUrl.searchParams.set("customerCount", encodeURIComponent(customerCount.toString()));
    flutterUrl.searchParams.set("productCount", encodeURIComponent(productCount.toString()));
    flutterUrl.searchParams.set("collectionCount", encodeURIComponent(collectionCount.toString()));
    flutterUrl.searchParams.set("abandonedCartCount", encodeURIComponent(abandonedCartCount.toString()));

    let hostParam = new URL(request.url).searchParams.get("host");
    if (hostParam) {
      if (hostParam.length % 4 !== 0) {
        hostParam = hostParam.padEnd(Math.ceil(hostParam.length / 4) * 4, "=");
      }
      flutterUrl.searchParams.set("host", encodeURIComponent(hostParam));
    }

    console.log("🔗 Fallback Flutter URL:", flutterUrl.toString());
    return redirect(flutterUrl.toString());
  }
};

export const action = async () => {
  return null;
};

export const defaultExport = () => null;
export default defaultExport;