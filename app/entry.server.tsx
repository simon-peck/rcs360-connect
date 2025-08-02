// app/entry.server.tsx
//import { PassThrough } from "stream";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { createReadableStreamFromReadable, type EntryContext } from "@remix-run/node";
import { isbot } from "isbot";

export const streamTimeout = 5000;

const allowedOrigins = [
  "https://admin.shopify.com",
  "https://app.rcs360.co.uk",
  "https://rcs360-connect.vercel.app",
];

function getCorsHeaders(origin: string | null): HeadersInit | undefined {
  if (origin && allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
  }
  return undefined;
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  console.log(`Request URL: ${request.url}, Method: ${request.method}`);
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    console.log(`Handling OPTIONS request for ${request.url}, Origin: ${origin}`);
    const corsHeaders = getCorsHeaders(origin);
    return new Response(null, {
      status: 204,
      headers: corsHeaders ?? {},
    });
  }

  // Removed addDocumentResponseHeaders import and call; handle headers manually if needed
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (corsHeaders) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
  }

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError: (error: unknown) => {
          reject(error);
        },
        onError: (error: unknown) => {
          responseStatusCode = 500;
          console.error("Render error:", error);
        },
      }
    );
    setTimeout(abort, streamTimeout + 1000);
  });
}