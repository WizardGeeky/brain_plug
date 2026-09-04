import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { MessageRole, UsageEventType, ApiKeyStatus } from "@prisma/client";
import { RagService } from "@/services/rag/rag.service";
import { AnalyticsService } from "@/services/analytics/analytics.service";
import { GeminiService } from "@/services/gemini/gemini.service";
import { EncryptionService } from "@/lib/encryption/encryption.service";
import { chatRequestSchema } from "@/schemas/chat.schema";
import { RateLimiter } from "@/server/rate-limit/rate-limiter";
import { Logger } from "@/lib/logger/logger";
import { getClientIp } from "@/lib/ip";
import { getCorsHeaders, handleCorsPreflight, isOriginAllowed } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const corsHeaders = getCorsHeaders(req);

  try {
    const rawBody = await req.json();
    const validated = chatRequestSchema.parse(rawBody);

    // 1. Resolve Agent & Tenant Context
    let tenantId: string | null = null;
    let apiKeyId: string | null = null;

    // A. Check for Bearer API Key, x-api-key header, or body apiKey
    let rawKey: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      rawKey = authHeader.substring(7).trim();
    } else if (req.headers.get("x-api-key")) {
      rawKey = req.headers.get("x-api-key")!.trim();
    } else if ((rawBody as any).apiKey) {
      rawKey = String((rawBody as any).apiKey).trim();
    }

    // Ignore placeholder dummy key if copied from example snippet
    if (rawKey === "YOUR_AGENT_API_KEY" || rawKey === "") {
      rawKey = null;
    }

    if (rawKey) {
      const keyHash = EncryptionService.hashSha256(rawKey);

      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { agent: true },
      });

      if (!apiKeyRecord || apiKeyRecord.status !== ApiKeyStatus.ACTIVE) {
        return new Response(
          JSON.stringify({ error: "Invalid or revoked API key", requestId }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ error: "API key has expired", requestId }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check agent match
      if (apiKeyRecord.agentId !== validated.agentId) {
        return new Response(
          JSON.stringify({ error: "API key is not authorized for this agent", requestId }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      tenantId = apiKeyRecord.tenantId;
      apiKeyId = apiKeyRecord.id;
    }

    // 2. Load Agent with Gemini Model & Widget Config
    const agent = await prisma.agent.findFirst({
      where: { id: validated.agentId, deletedAt: null },
      include: {
        geminiModel: true,
        widgetConfig: true,
        allowedDomains: true,
      },
    });

    if (!agent) {
      return new Response(
        JSON.stringify({ error: "Agent not found or unavailable", requestId }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (agent.status !== "ACTIVE") {
      return new Response(
        JSON.stringify({ error: "Agent is currently inactive or draft", requestId }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!tenantId) {
      tenantId = agent.tenantId;
    }

    // Check Origin allowlist / host address if configured
    const origin = req.headers.get("origin") || req.headers.get("referer");
    if (origin && agent.allowedDomains && agent.allowedDomains.length > 0) {
      const isAllowed = isOriginAllowed(origin, agent.allowedDomains);
      if (!isAllowed) {
        return new Response(
          JSON.stringify({
            error: `Host address ${origin} is not authorized for this agent. Please add it to Allowed Domains in Agent settings.`,
            requestId,
          }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Validate Model from DB
    if (!agent.geminiModelId) {
      return new Response(
        JSON.stringify({ error: "No Gemini model is configured for this agent.", requestId }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const geminiModel = await GeminiService.validateModel(agent.geminiModelId);

    // Rate Limiting per agent
    const clientIp = getClientIp(req);
    RateLimiter.check(`chat:${agent.id}:${clientIp}`, 60, 60);

    // 3. Resolve / Create Conversation
    let conversation = validated.conversationId
      ? await prisma.conversation.findFirst({
          where: { id: validated.conversationId, agentId: agent.id },
        })
      : null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId,
          agentId: agent.id,
          sessionId: validated.conversationId || undefined,
          title: validated.message.substring(0, 40) + "...",
          userIp: clientIp,
        },
      });
    }

    // 4. Save User Message
    const userTokens = GeminiService.estimateTokens(validated.message);
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: validated.message,
        inputTokens: userTokens,
      },
    });

    // 5. RAG Pipeline: Retrieve relevant knowledge chunks & build prompt strictly isolated to tenant & agent
    let systemInstruction = agent.systemPrompt;
    let promptToSend = validated.message;
    let sources: Array<{ fileName: string; similarity: number }> = [];

    if (agent.ragEnabled) {
      const ragResult = await RagService.buildGroundedContext(
        tenantId,
        agent.id,
        validated.message,
        agent.systemPrompt,
        agent.topK,
        agent.similarityThreshold
      );

      systemInstruction = ragResult.groundedSystemPrompt;
      promptToSend = ragResult.groundedUserPrompt;
      sources = ragResult.sources;
    }

    // 6. SSE Stream Setup
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          // Send initial metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "start",
                conversationId: conversation.id,
                sources,
              })}\n\n`
            )
          );

          // Stream Gemini tokens
          const tokenStream = GeminiService.streamResponse(
            geminiModel.modelName,
            systemInstruction,
            promptToSend,
            agent.temperature,
            agent.maxOutputTokens,
            undefined
          );

          for await (const chunk of tokenStream) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "token",
                  content: chunk,
                })}\n\n`
              )
            );
          }

          const latencyMs = Date.now() - startTime;
          const outputTokens = GeminiService.estimateTokens(fullResponse);

          // 7. Persist Assistant message with sources
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: MessageRole.ASSISTANT,
              content: fullResponse,
              inputTokens: userTokens,
              outputTokens,
              latencyMs,
              sources: sources.length > 0 ? JSON.parse(JSON.stringify(sources)) : undefined,
            },
          });

          // 8. Log Analytics Event
          await AnalyticsService.recordUsage({
            tenantId,
            agentId: agent.id,
            apiKeyId,
            eventType: UsageEventType.CHAT_SUCCESS,
            requestId,
            inputTokens: userTokens,
            outputTokens,
            latencyMs,
            metadata: {
              model: geminiModel.modelName,
              sourcesCount: sources.length,
            },
          });

          // Send finish event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                conversationId: conversation.id,
                fullContent: fullResponse,
                sources,
                latencyMs,
              })}\n\n`
            )
          );

          controller.close();
        } catch (err: unknown) {
          Logger.error("Chat SSE Streaming failed", err, { agentId: agent.id });
          const errorMessage =
            err instanceof Error ? err.message : "Error streaming response";

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: errorMessage,
              })}\n\n`
            )
          );

          await AnalyticsService.recordUsage({
            tenantId,
            agentId: agent.id,
            apiKeyId,
            eventType: UsageEventType.CHAT_FAILURE,
            requestId,
            metadata: { error: errorMessage },
          });

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Request-Id": requestId,
        ...corsHeaders,
      },
    });
  } catch (err: unknown) {
    Logger.error("Chat API error", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "An error occurred",
        requestId,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
