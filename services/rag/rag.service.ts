import { prisma } from "@/lib/db/prisma";
import { GeminiService } from "@/services/gemini/gemini.service";
import { Logger } from "@/lib/logger/logger";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  fileName: string;
  content: string;
  similarity: number;
}

export interface RagResult {
  groundedSystemPrompt: string;
  groundedUserPrompt: string;
  retrievedChunks: RetrievedChunk[];
  sources: Array<{ fileName: string; similarity: number }>;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function keywordOverlapScore(query: string, content: string): number {
  if (!query || !content) return 0;
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (words.length === 0) return 0;

  const contentLower = content.toLowerCase();
  let matchCount = 0;
  for (const w of words) {
    if (contentLower.includes(w)) {
      matchCount++;
    }
  }
  return matchCount / words.length;
}

function isGreetingOrPleasantry(query: string): boolean {
  if (!query) return false;
  const clean = query.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const greetings = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "greetings",
    "who are you",
    "what can you do",
    "help",
    "start",
    "howdy",
    "hola",
    "namaste",
    "thanks",
    "thank you",
    "hi there",
    "hello there",
    "hey there",
  ];
  if (greetings.includes(clean)) return true;
  if (/^(hi|hello|hey|greetings)\b/i.test(clean) && clean.length <= 15) return true;
  return false;
}

export class RagService {
  /**
   * Performs vector similarity search and builds grounded prompt for Gemini
   */
  public static async buildGroundedContext(
    tenantId: string,
    agentId: string,
    userQuery: string,
    baseSystemPrompt: string,
    topK = 5,
    similarityThreshold = 0.4
  ): Promise<RagResult> {
    try {
      // 0. Handle natural conversational greetings
      if (isGreetingOrPleasantry(userQuery)) {
        const groundedSystemPrompt = `${baseSystemPrompt}

==================================================
CONVERSATIONAL GREETING INSTRUCTION
==================================================
The user is saying a greeting or introducing themselves.
- Greet them warmly and professionally in character.
- In 1-2 friendly sentences, let them know you are ready to answer their questions based on the company's verified knowledge base.`;

        return {
          groundedSystemPrompt,
          groundedUserPrompt: userQuery,
          retrievedChunks: [],
          sources: [],
        };
      }

      // 1. Generate query embedding
      const queryEmbedding = await GeminiService.generateEmbedding(userQuery);

      // 2. Fetch active candidate chunks for this agent & tenant
      const chunks = await prisma.documentChunk.findMany({
        where: {
          tenantId,
          agentId,
          document: { deletedAt: null, status: "PROCESSED" },
        },
        include: {
          document: {
            select: { originalFileName: true },
          },
        },
      });

      if (!chunks || chunks.length === 0) {
        return {
          groundedSystemPrompt: `${baseSystemPrompt}

==================================================
STRICT KNOWLEDGE BASE GROUNDING RULES
==================================================
CRITICAL INSTRUCTION: You are strictly constrained to your company's knowledge base. No knowledge documents are currently loaded.
When asked questions, you MUST reply:
"I am sorry, but I do not have information about that in my knowledge base. I can only assist with questions regarding our verified services and documentation."
Do NOT answer from outside memory.`,
          groundedUserPrompt: userQuery,
          retrievedChunks: [],
          sources: [],
        };
      }

      // 3. Compute hybrid score (vector cosine similarity + keyword overlap)
      const effectiveThreshold = Math.min(similarityThreshold, 0.25);

      const scoredChunks: RetrievedChunk[] = chunks
        .map((chunk) => {
          const chunkVec = (chunk.embedding as number[]) || [];
          const cosSim = cosineSimilarity(queryEmbedding, chunkVec);
          const kwSim = keywordOverlapScore(userQuery, chunk.content);
          const hybridSim = cosSim > 0.05 ? 0.65 * cosSim + 0.35 * kwSim : kwSim * 0.85;

          return {
            id: chunk.id,
            documentId: chunk.documentId,
            fileName: chunk.document.originalFileName,
            content: chunk.content,
            similarity: Number(hybridSim.toFixed(4)),
          };
        })
        .filter((c) => c.similarity >= effectiveThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      // If no relevant chunks meet the threshold
      if (scoredChunks.length === 0) {
        return {
          groundedSystemPrompt: `${baseSystemPrompt}

==================================================
STRICT KNOWLEDGE BASE GROUNDING RULES
==================================================
CRITICAL INSTRUCTION: The user's query does not match any information in your verified knowledge base.
You MUST politely decline to answer by replying:
"I am sorry, but I do not have information about that in my knowledge base. I can only assist with questions regarding our verified services and documentation."
Do NOT attempt to answer from external memory or general knowledge.`,
          groundedUserPrompt: userQuery,
          retrievedChunks: [],
          sources: [],
        };
      }

      // Build knowledge context block
      let knowledgeText = "--- BEGIN RETRIEVED KNOWLEDGE CONTEXT ---\n";
      scoredChunks.forEach((chunk) => {
        knowledgeText += `[Document: ${chunk.fileName} | Relevance: ${(chunk.similarity * 100).toFixed(1)}%]\n${chunk.content}\n\n`;
      });
      knowledgeText += "--- END RETRIEVED KNOWLEDGE CONTEXT ---";

      const groundedSystemPrompt = `${baseSystemPrompt}

==================================================
STRICT KNOWLEDGE BASE GROUNDING & SCOPE CONSTRAINTS
==================================================
You are an AI assistant whose knowledge is STRICTLY LIMITED to the verified knowledge documents provided below.

MANDATORY RULES:
1. Grounding: Answer the user's question USING ONLY the facts and policies explicitly mentioned in the KNOWLEDGE CONTEXT below.
2. Scope Limit: If the user's question asks about something that is NOT mentioned or cannot be directly proven from the knowledge context below (such as general knowledge, outside news, unrelated code, or other companies), you MUST decline and respond:
   "I am sorry, but I do not have information about that in my knowledge base. I can only assist with questions regarding our verified services and documentation."
3. No Hallucinations: Do NOT invent, assume, or extrapolate facts beyond what is written.
4. Tone: Keep replies professional, friendly, concise, and grounded.`;

      const groundedUserPrompt = `${knowledgeText}\n\nUser Question: ${userQuery}`;

      const sources = Array.from(
        new Map(
          scoredChunks.map((c) => [c.fileName, { fileName: c.fileName, similarity: c.similarity }])
        ).values()
      );

      return {
        groundedSystemPrompt,
        groundedUserPrompt,
        retrievedChunks: scoredChunks,
        sources,
      };
    } catch (err) {
      Logger.error("RAG pipeline search failed, falling back to base prompt", err);
      return {
        groundedSystemPrompt: baseSystemPrompt,
        groundedUserPrompt: userQuery,
        retrievedChunks: [],
        sources: [],
      };
    }
  }
}
