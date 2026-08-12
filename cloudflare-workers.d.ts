// Minimal compatibility declaration for Cloudflare-only modules kept in this
// repository. The Vercel/Next.js application does not import these modules.
declare module "cloudflare:workers" {
  export const env: Record<string, unknown> & { DB?: import("@cloudflare/workers-types").D1Database };
}
