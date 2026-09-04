import { NextRequest } from "next/server";

/**
 * Extracts and normalizes the real client IP address from request headers or socket.
 * Eliminates IPv6 loopbacks like `::1` or `::ffff:127.0.0.1` by converting them to clean IPv4 `127.0.0.1`,
 * and parses multi-hop proxy chains (e.g. Cloudflare, AWS ALB, Nginx).
 */
export function getClientIp(req: NextRequest | Headers | Request | any): string {
  try {
    let headers: Headers;

    if (req instanceof Headers) {
      headers = req;
    } else if (req && "headers" in req && req.headers instanceof Headers) {
      headers = req.headers;
    } else if (req && typeof req.headers?.get === "function") {
      headers = req.headers;
    } else if (req && typeof req.headers === "object") {
      // Plain object headers
      const obj = req.headers;
      const rawIp =
        obj["cf-connecting-ip"] ||
        obj["x-real-ip"] ||
        obj["x-forwarded-for"] ||
        obj["x-client-ip"] ||
        "127.0.0.1";
      return cleanIp(String(rawIp));
    } else {
      return "127.0.0.1";
    }

    // 1. Cloudflare header (most reliable when behind CF)
    const cfIp = headers.get("cf-connecting-ip");
    if (cfIp) return cleanIp(cfIp);

    // 2. Standard X-Real-IP
    const realIp = headers.get("x-real-ip");
    if (realIp) return cleanIp(realIp);

    // 3. X-Forwarded-For (take the first client IP in chain)
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor) {
      const parts = forwardedFor.split(",").map((p) => p.trim());
      for (const part of parts) {
        const cleaned = cleanIp(part);
        if (cleaned && cleaned !== "127.0.0.1" && cleaned !== "unknown") {
          return cleaned;
        }
      }
      if (parts[0]) return cleanIp(parts[0]);
    }

    // 4. Other proxy headers
    const clientIp = headers.get("x-client-ip") || headers.get("fastly-client-ip");
    if (clientIp) return cleanIp(clientIp);

    // 5. Next.js socket IP (if available)
    if (req && typeof req.ip === "string" && req.ip) {
      return cleanIp(req.ip);
    }

    return "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

/**
 * Cleans and formats raw IP string:
 * - Maps `::1`, `0:0:0:0:0:0:0:1`, `::ffff:127.0.0.1` to `127.0.0.1`
 * - Strips port numbers if present (e.g., `192.168.1.1:54321` -> `192.168.1.1`)
 * - Strips brackets from IPv6 (e.g., `[2001:db8::1]` -> `2001:db8::1`)
 */
export function cleanIp(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "127.0.0.1";

  let ip = raw.trim();

  // Strip brackets if present
  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.substring(1, ip.indexOf("]"));
  }

  // Handle mapped IPv4 in IPv6 (e.g. ::ffff:192.168.1.1)
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  // Handle IPv6 localhost
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1" || ip === "::" || ip === "localhost") {
    return "127.0.0.1";
  }

  // If port is attached to IPv4 (e.g. 192.168.1.5:8080)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
    ip = ip.split(":")[0];
  }

  return ip;
}
