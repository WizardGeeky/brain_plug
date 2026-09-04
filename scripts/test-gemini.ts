import { GeminiService } from "../services/gemini/gemini.service";
import { prisma } from "../lib/db/prisma";

async function main() {
  try {
    const status = await GeminiService.getApiKeyStatus();
    console.log("Gemini API Key status:", status);

    const testRes = await GeminiService.testApiKey();
    console.log("Test API Key result:", testRes);

    const agents = await prisma.agent.findMany({
      include: { geminiModel: true },
    });
    for (const a of agents) {
      console.log(`Agent ${a.name} (${a.id}) -> Model: ${a.geminiModel?.modelName} (${a.geminiModel?.displayName})`);
    }
  } catch (err) {
    console.error("Gemini test failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
