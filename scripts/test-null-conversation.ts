import { NextRequest } from "next/server";
import { POST as chatPost } from "../app/api/v1/chat/route";
import { prisma } from "../lib/db/prisma";

async function main() {
  const agentId = "7135bad7-5eee-4362-861f-71e981649afd";

  console.log("Testing chat POST with conversationId = null...");
  const chatPostReq = new NextRequest("http://localhost:3000/api/v1/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3001",
    },
    body: JSON.stringify({
      agentId,
      conversationId: null,
      message: "Hi",
    }),
  });

  const res = await chatPost(chatPostReq);
  console.log("Status:", res.status);
  console.log("Headers:", {
    contentType: res.headers.get("content-type"),
    corsOrigin: res.headers.get("access-control-allow-origin"),
  });

  if (res.status !== 200) {
    const json = await res.json();
    console.error("Error response:", json);
    throw new Error("Chat test failed");
  }

  if (res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let streamText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamText += decoder.decode(value, { stream: true });
    }
    console.log("Stream output:\n" + streamText);
  }

  console.log("✅ Chat POST with conversationId = null succeeded!");
}

main().finally(() => prisma.$disconnect());
