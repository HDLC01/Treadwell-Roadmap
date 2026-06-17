import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";

// Inline Subresource Integrity plugin (no third-party build dependency — keeps
// the build supply-chain surface minimal). After the bundle is generated, it
// rewrites index.html to add integrity="sha384-…" to the same-origin
// <script>/<link> tags that reference emitted assets. The tags already carry
// crossorigin, which SRI requires. The browser then verifies the served bundle
// byte-for-byte against the embedded hash.
function htmlSri() {
  return {
    name: "html-sri",
    apply: "build" as const,
    transformIndexHtml: {
      order: "post" as const,
      handler(html: string, ctx: { bundle?: Record<string, any> }) {
        const bundle = ctx.bundle || {};
        const integrityFor = (url: string): string | null => {
          const asset = bundle[url.replace(/^\//, "")];
          if (!asset) return null;
          const content = asset.type === "chunk" ? asset.code : asset.source;
          const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
          return "sha384-" + createHash("sha384").update(buf).digest("base64");
        };
        return html.replace(/<(?:script|link)\b[^>]*>/g, (tag) => {
          if (/\sintegrity=/.test(tag)) return tag;
          const m = tag.match(/\b(?:src|href)="(\/[^"]+)"/);
          if (!m) return tag;
          const integ = integrityFor(m[1]);
          if (!integ) return tag;
          return tag.replace(/\s*\/?>$/, ` integrity="${integ}">`);
        });
      },
    },
  };
}

// Dev server proxies /api to the FastAPI backend on :8892 (forwarding the
// session cookie). Production build outputs to dist/, served by FastAPI.
export default defineConfig({
  plugins: [react(), htmlSri()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8892",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
