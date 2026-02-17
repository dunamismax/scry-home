import { env } from "~/lib/env.server";

export function getSecurityHeaders(): Record<string, string> {
  const isProduction = env.NODE_ENV === "production";

  return {
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-permitted-cross-domain-policies": "none",
    "x-dns-prefetch-control": "off",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
    "content-security-policy": [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      isProduction ? "script-src 'self'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      isProduction ? "connect-src 'self'" : "connect-src 'self' ws: wss: http: https:",
    ].join("; "),
  };
}

export function getSameOriginError(request: Request): string | null {
  const method = request.method.toUpperCase();

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return "Missing origin header";
  }

  const requestUrl = new URL(request.url);
  if (origin !== requestUrl.origin) {
    return "Cross-origin request blocked";
  }

  return null;
}
