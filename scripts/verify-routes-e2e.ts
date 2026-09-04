import { NextRequest } from "next/server";
import { OPTIONS as chatOptions, POST as chatPost } from "../app/api/v1/chat/route";
import { GET as widgetGet, OPTIONS as widgetOptions } from "../app/api/v1/widget/config/[agentId]/route";
import { prisma } from "../lib/db/prisma";

async function main() {
  const agentId = "7135bad7-5eee-4362-861f-71e981649afd";

  console.log("=== 1. Testing Widget Config GET & OPTIONS (Cross-Origin) ===");
  const optReq = new NextRequest(`http://localhost:3000/api/v1/widget/config/${agentId}`, {
    method: "OPTIONS",
    headers: { origin: "http://localhost:3001" },
  });
  const optRes = await widgetOptions(optReq);
  console.log("Widget Config OPTIONS status:", optRes.status);
  console.log("Widget Config OPTIONS CORS:", optRes.headers.get("access-control-allow-origin"));

  const getReq = new NextRequest(`http://localhost:3000/api/v1/widget/config/${agentId}`, {
    method: "GET",
    headers: { origin: "http://localhost:3001" },
  });
  const getRes = await widgetGet(getReq, { params: Promise.resolve({ agentId }) });
  console.log("Widget Config GET status:", getRes.status);
  const getJson = await getRes.json();
  console.log("Widget Config GET data:", {
    name: getJson.data?.name,
    welcome: getJson.data?.welcomeMessage,
    primaryColor: getJson.data?.widgetConfig?.primaryColor,
  });

  console.log("\n=== 2. Testing Chat Route OPTIONS (Preflight) ===");
  const chatOptReq = new NextRequest("http://localhost:3000/api/v1/chat", {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:3001",
      "access-control-request-headers": "content-type, x-api-key",
      "access-control-request-method": "POST",
    },
  });
  const chatOptRes = await chatOptions(chatOptReq);
  console.log("Chat OPTIONS status:", chatOptRes.status);
  console.log("Chat OPTIONS Allow-Origin:", chatOptRes.headers.get("access-control-allow-origin"));
  console.log("Chat OPTIONS Allow-Methods:", chatOptRes.headers.get("access-control-allow-methods"));

  console.log("\n=== 3. Testing Chat Route POST (Widget Message Streaming) ===");
  const chatPostReq = new NextRequest("http://localhost:3000/api/v1/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3001",
      "x-api-key": "YOUR_AGENT_API_KEY", // test placeholder key handling
    },
    body: JSON.stringify({
      agentId,
      message: "Hello! What can you help me with?",
    }),
  });

  const chatPostRes = await chatPost(chatPostReq);
  console.log("Chat POST status:", chatPostRes.status);
  console.log("Chat POST Content-Type:", chatPostRes.headers.get("content-type"));
  console.log("Chat POST Allow-Origin:", chatPostRes.headers.get("access-control-allow-origin"));

  if (chatPostRes.body) {
    const reader = chatPostRes.body.getReader();
    const decoder = new TextDecoder();
    let streamText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamText += decoder.decode(value, { stream: true });
    }
    console.log("Chat SSE Stream Output:\n" + streamText.substring(0, 300) + "...\n");
  }

  console.log("✅ All End-to-End Route Tests PASSED!");
}

main().finally(() => prisma.$disconnect());
