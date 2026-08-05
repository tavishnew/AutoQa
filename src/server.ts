import "dotenv/config";
import "./lib/error-capture";
import { auth } from "./auth";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { TRUSTED_ORIGINS } from "@/lib/trusted-origins";

const TRUSTED_ORIGIN_SET = new Set<string>(TRUSTED_ORIGINS);

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function corsHeaders(origin: string) {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return headers;
}

function isTrustedOrigin(origin: string | null): boolean {
  return origin !== null && TRUSTED_ORIGIN_SET.has(origin);
}

async function handleCORS(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/auth/")) return null;

  const origin = request.headers.get("origin");
  if (!isTrustedOrigin(origin)) return null;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin!) });
  }

  return null;
}

async function handleAuth(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/auth/")) {
    return auth.handler(request);
  }
  return null;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const corsResponse = await handleCORS(request);
    if (corsResponse) return corsResponse;

    const authResponse = await handleAuth(request);
    if (authResponse) {
      const origin = request.headers.get("origin");
      if (isTrustedOrigin(origin)) {
        const headers = new Headers(authResponse.headers);
        corsHeaders(origin!).forEach((value, key) => headers.set(key, value));
        return new Response(authResponse.body, {
          status: authResponse.status,
          statusText: authResponse.statusText,
          headers,
        });
      }
      return authResponse;
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
