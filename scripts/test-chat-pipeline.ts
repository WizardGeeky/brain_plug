import { prisma } from "../lib/db/prisma";
import { RagService } from "../services/rag/rag.service";
import { GeminiService } from "../services/gemini/gemini.service";
import { WidgetService } from "../services/widget/widget.service";

async function main() {
  const agentId = "7135bad7-5eee-4362-861f-71e981649afd";
  console.log("Testing Agent:", agentId);

  // 1. Test public widget config
  try {
    const config = await WidgetService.getPublicWidgetConfig(agentId);
    console.log("Widget Config Success:", {
      id: config.id,
      name: config.name,
      welcome: config.welcomeMessage,
      widgetConfig: config.widgetConfig,
    });
  } catch (err: any) {
    console.error("Widget Config Error:", err.message);
  }

  // 2. Test Agent Knowledge Base / Chunks
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      tenant: true,
      geminiModel: true,
      allowedDomains: true,
      documents: { where: { deletedAt: null } },
      documentChunks: true,
    },
  });

  console.log("Agent details:", {
    tenantId: agent?.tenantId,
    tenantName: agent?.tenant.name,
    model: agent?.geminiModel?.modelName,
    docsCount: agent?.documents.length,
    chunksCount: agent?.documentChunks.length,
    allowedDomains: agent?.allowedDomains,
  });

  if (agent && agent.geminiModel) {
    // 3. Test RAG Context building
    const rag = await RagService.buildGroundedContext(
      agent.tenantId,
      agent.id,
      "What is this company about?",
      agent.systemPrompt
    );
    console.log("RAG build grounded context result:", {
      sources: rag.sources,
      retrievedChunksCount: rag.retrievedChunks.length,
    });

    // 4. Test Gemini stream with grounded prompt
    console.log("Testing Gemini stream generation...");
    try {
      const stream = GeminiService.streamResponse(
        agent.geminiModel.modelName,
        rag.groundedSystemPrompt,
        rag.groundedUserPrompt,
        agent.temperature,
        agent.maxOutputTokens
      );

      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
      }
      console.log("Gemini Stream Success! Output preview:", fullText.substring(0, 150));
    } catch (streamErr: any) {
      console.error("Gemini Stream Error:", streamErr);
    }
  }
}

main().finally(() => prisma.$disconnect());
