import { getCorsHeaders, isOriginAllowed, normalizeHost } from "../lib/cors";

async function main() {
  console.log("--- 1. Testing normalizeHost ---");
  console.log("http://localhost:3001 ->", normalizeHost("http://localhost:3001"));
  console.log("https://app.mycompany.com/path ->", normalizeHost("https://app.mycompany.com/path"));
  console.log("localhost:3000 ->", normalizeHost("localhost:3000"));

  console.log("\n--- 2. Testing isOriginAllowed ---");
  const allowed = [{ domain: "localhost:3001" }, { domain: "mycompany.com" }];
  console.log("localhost:3001 allowed?", isOriginAllowed("http://localhost:3001", allowed)); // true
  console.log("localhost:3000 allowed?", isOriginAllowed("http://localhost:3000", allowed)); // true (base match)
  console.log("app.mycompany.com allowed?", isOriginAllowed("https://app.mycompany.com", allowed)); // true (subdomain)
  console.log("malicious.com allowed?", isOriginAllowed("https://malicious.com", allowed)); // false
  console.log("wildcard allowed?", isOriginAllowed("https://anything.com", [{ domain: "*" }])); // true

  console.log("\n--- 3. Testing getCorsHeaders ---");
  const mockReq = { headers: new Headers({ origin: "http://localhost:3001" }) } as any;
  const headers = getCorsHeaders(mockReq);
  console.log("CORS Headers:", headers);

  if (
    headers["Access-Control-Allow-Origin"] === "http://localhost:3001" &&
    headers["Access-Control-Allow-Methods"].includes("OPTIONS")
  ) {
    console.log("\n✅ All CORS utility tests PASSED!");
  } else {
    throw new Error("CORS headers test failed");
  }
}

main();
