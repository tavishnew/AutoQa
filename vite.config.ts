// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig, type UserConfig } from "@lovable.dev/vite-tanstack-config";

// ponytail: vite's built-in CORS middleware answers OPTIONS preflights with
// Access-Control-Allow-Origin but no Allow-Credentials, so credentialed
// fetches (better-auth uses credentials:'include') never get past preflight
// in dev. Vite registers its CORS middleware before user plugins so a normal
// .use() can't outrun it — splice into the connect stack at index 0 so the
// handler runs before vite's CORS.
function devCredentialsCorsPlugin(): NonNullable<UserConfig["plugins"]>[number] {
  return {
    name: "dev-credentials-cors",
    apply: "serve",
    configureServer(server) {
      const middleware: import("connect").HandleFunction = (req, res, next) => {
        if (req.method !== "OPTIONS") {
          next();
          return;
        }
        const rawUrl = req.url ?? "";
        const path = rawUrl.split("?")[0];
        if (!path.startsWith("/api/auth/")) {
          next();
          return;
        }
        const originHeader = req.headers.origin;
        const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
        const reqMethod = req.headers["access-control-request-method"];
        const reqHeaders = req.headers["access-control-request-headers"];
        res.statusCode = 204;
        if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin, Access-Control-Request-Headers");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader(
          "Access-Control-Allow-Methods",
          typeof reqMethod === "string" ? reqMethod : "GET, POST, OPTIONS",
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          typeof reqHeaders === "string" ? reqHeaders : "Content-Type",
        );
        res.end();
      };
      const stack = (server.middlewares as unknown as {
        stack: Array<{ route: string; handle: import("connect").HandleFunction }>;
      }).stack;
      stack.unshift({ route: "", handle: middleware });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [devCredentialsCorsPlugin()],
    server: {
      port: 8083,
      strictPort: true,
    },
  },
});
