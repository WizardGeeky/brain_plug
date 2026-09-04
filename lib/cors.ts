import { NextRequest } from "next/server";

export function getCorsHeaders(req?: Request | NextRequest | null): Record<string, string> {
  const origin = req?.headers ? req.headers.get("origin") : null;

  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, X-Request-Id, Accept, Origin",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function handleCorsPreflight(req: Request | NextRequest): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export function normalizeHost(urlOrHost: string): string {
  if (!urlOrHost) return "";
  let clean = urlOrHost.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, "");
  clean = clean.split("/")[0];
  return clean;
}

export function isOriginAllowed(
  requestOriginOrHost: string | null | undefined,
  allowedDomains: Array<{ domain: string } | string>
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true;
  }

  const domainStrings = allowedDomains
    .map((d) => (typeof d === "string" ? d : d.domain))
    .filter(Boolean)
    .map((d) => d.trim());

  if (domainStrings.length === 0) {
    return true;
  }

  // If wildcard '*' is allowed
  if (domainStrings.some((d) => d === "*")) {
    return true;
  }

  if (!requestOriginOrHost) {
    return true;
  }

  const reqHost = normalizeHost(requestOriginOrHost);
  const reqHostBase = reqHost.split(":")[0];

  for (const domain of domainStrings) {
    const cleanAllowed = normalizeHost(domain);
    const allowedBase = cleanAllowed.split(":")[0];

    // 1. Exact match (including port if specified, e.g. localhost:3001)
    if (reqHost === cleanAllowed) {
      return true;
    }

    // 2. Base host match (e.g. localhost matching localhost:3001 or localhost:3000)
    if (reqHostBase === allowedBase) {
      return true;
    }

    // 3. Subdomain match (e.g. app.mycompany.com matching mycompany.com)
    if (reqHostBase.endsWith(`.${allowedBase}`)) {
      return true;
    }
  }

  return false;
}
