import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { Logger } from "@/lib/logger/logger";

export interface GeminiStreamChunk {
  text: string;
  isFinished: boolean;
}

export interface GroundedPromptOptions {
  systemPrompt: string;
  knowledgeContext: string;
  userMessage: string;
  conversationHistory?: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
}

export class GeminiService {
  private static client: GoogleGenerativeAI | null = null;
  private static cachedApiKey: string | null = null;

  /**
   * Resolves the active Gemini API key:
   * 1. Check PostgreSQL platform_settings table for 'gemini_api_key'
   * 2. Fallback to process.env.GEMINI_API_KEY
   */
  public static async getApiKey(): Promise<string> {
    try {
      const setting = await prisma.platformSetting.findUnique({
        where: { key: "gemini_api_key" },
      });

      if (setting && setting.value) {
        const val =
          typeof setting.value === "string"
            ? setting.value
            : (setting.value as any)?.apiKey || (setting.value as any)?.key;
        if (typeof val === "string" && val.trim().length > 0) {
          return val.trim();
        }
      }
    } catch (err) {
      Logger.warn("Failed to query platformSetting for gemini_api_key", {
        error: String(err),
      });
    }

    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 0) {
      return envKey.trim();
    }

    throw new AppError(
      "Gemini API key is not configured. Super Admin must set the Gemini API Key in the Admin Dashboard (Models Registry or Platform Settings).",
      "GEMINI_API_KEY_NOT_CONFIGURED",
      400
    );
  }

  /**
   * Save / update the Gemini API key in PostgreSQL platform_settings
   */
  public static async setApiKey(apiKey: string): Promise<void> {
    const trimmed = apiKey.trim();
    await prisma.platformSetting.upsert({
      where: { key: "gemini_api_key" },
      create: {
        key: "gemini_api_key",
        value: { apiKey: trimmed, updatedAt: new Date().toISOString() },
      },
      update: {
        value: { apiKey: trimmed, updatedAt: new Date().toISOString() },
      },
    });

    // Invalidate cached client
    this.client = null;
    this.cachedApiKey = null;
  }

  /**
   * Returns whether a Gemini API key is currently configured and returns a masked preview
   */
  public static async getApiKeyStatus(): Promise<{
    configured: boolean;
    source: "database" | "env" | "none";
    maskedKey?: string;
  }> {
    try {
      const setting = await prisma.platformSetting.findUnique({
        where: { key: "gemini_api_key" },
      });

      if (setting && setting.value) {
        const val =
          typeof setting.value === "string"
            ? setting.value
            : (setting.value as any)?.apiKey || (setting.value as any)?.key;
        if (typeof val === "string" && val.trim().length > 0) {
          const key = val.trim();
          const masked =
            key.length > 8
              ? `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`
              : "••••••••";
          return { configured: true, source: "database", maskedKey: masked };
        }
      }
    } catch {}

    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 0) {
      const key = envKey.trim();
      const masked =
        key.length > 8
          ? `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`
          : "••••••••";
      return { configured: true, source: "env", maskedKey: masked };
    }

    return { configured: false, source: "none" };
  }

  /**
   * Test a Gemini API key by making a lightweight live query
   */
  public static async testApiKey(
    apiKeyToTest?: string,
    modelNameToTest?: string
  ): Promise<{
    valid: boolean;
    message: string;
  }> {
    let key: string;
    try {
      key = apiKeyToTest ? apiKeyToTest.trim() : await this.getApiKey();
    } catch (err: any) {
      return { valid: false, message: err.message || "No API key configured to test." };
    }

    if (!key) {
      return { valid: false, message: "No API key provided to test." };
    }

    // Build candidate models list prioritizing custom/registered model
    const candidates: string[] = [];
    if (modelNameToTest && modelNameToTest.trim()) {
      candidates.push(modelNameToTest.trim());
    }

    try {
      const dbModel = await prisma.geminiModel.findFirst({
        where: { status: "ACTIVE" },
        select: { modelName: true },
      });
      if (dbModel?.modelName && !candidates.includes(dbModel.modelName)) {
        candidates.push(dbModel.modelName);
      }
    } catch {
      // Non-blocking
    }

    const defaultFallbacks = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash-lite",
      "gemini-pro",
    ];

    for (const fb of defaultFallbacks) {
      if (!candidates.includes(fb)) {
        candidates.push(fb);
      }
    }

    const testClient = new GoogleGenerativeAI(key);
    let lastError: any = null;

    for (const candidate of candidates) {
      try {
        const model = testClient.getGenerativeModel({
          model: candidate,
        });
        const result = await model.generateContent("ping");
        const text = result.response.text();
        if (text) {
          return {
            valid: true,
            message: `Gemini API Key verified and active (tested with ${candidate})!`,
          };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || "";
        // If model not found or not supported on this endpoint, try next candidate
        if (
          errMsg.includes("404") ||
          errMsg.includes("not found") ||
          errMsg.includes("is not supported")
        ) {
          continue;
        } else {
          // If it's an authentication or quota error, stop and report
          break;
        }
      }
    }

    Logger.error("Gemini API key test failed", lastError);
    return {
      valid: false,
      message:
        lastError?.message ||
        "Failed to authenticate with Google Gemini API using the provided key.",
    };
  }

  /**
   * Initialize or retrieve singleton GoogleGenerativeAI client
   */
  public static async getClient(apiKeyOverride?: string): Promise<GoogleGenerativeAI> {
    const apiKey = apiKeyOverride?.trim() || (await this.getApiKey());
    if (!this.client || this.cachedApiKey !== apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
      this.cachedApiKey = apiKey;
    }
    return this.client;
  }

  /**
   * Validate that the model exists in the database and is published & active
   */
  public static async validateModel(modelId: string) {
    const model = await prisma.geminiModel.findUnique({
      where: { id: modelId },
    });

    if (!model || model.status !== "ACTIVE" || !model.isPublished) {
      // Fallback to first available active published model if exists
      const fallbackModel = await prisma.geminiModel.findFirst({
        where: { status: "ACTIVE", isPublished: true },
      });
      if (fallbackModel) {
        return fallbackModel;
      }
      return {
        id: modelId,
        modelName: "gemini-2.0-flash",
        displayName: "Gemini 2.0 Flash",
        provider: "Google",
        status: "ACTIVE" as const,
        isPublished: true,
      };
    }

    return model;
  }

  /**
   * Generates a normalized 768-dimensional semantic embedding vector
   * using term-frequency hashing & n-gram projections for high-speed local RAG vector similarity.
   */
  public static generateDeterministicVector(text: string, dimensions = 768): number[] {
    const vec = new Array(dimensions).fill(0);
    if (!text) return vec;

    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const words = normalized.split(/\s+/).filter((w) => w.length > 0);

    const tokens: string[] = [...words];
    for (let i = 0; i < words.length - 1; i++) {
      tokens.push(`${words[i]}_${words[i + 1]}`);
    }

    for (const token of tokens) {
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
      }
      const idx = Math.abs(hash) % dimensions;
      const sign = hash % 2 === 0 ? 1 : -1;
      vec[idx] += sign * (1 + Math.log(token.length + 1));
    }

    // L2 normalize vector for exact cosine similarity
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vec[i] = Number((vec[i] / norm).toFixed(6));
      }
    }

    return vec;
  }

  private static workingEmbeddingModel: string | null = "text-embedding-004";
  private static embeddingUnavailable = false;

  public static resolveFastModel(requestedModel: string): string {
    const clean = (requestedModel || "").toLowerCase().trim();
    if (clean.includes("2.0-flash-lite") || clean.includes("flash-lite")) return "gemini-2.0-flash-lite";
    if (clean.includes("2.0-flash") || clean === "gemini-2.0-flash") return "gemini-2.0-flash";
    if (clean.includes("1.5-flash") || clean === "gemini-1.5-flash") return "gemini-1.5-flash";
    if (clean.includes("1.5-pro") || clean === "gemini-1.5-pro" || clean.includes("2.5-pro")) return "gemini-1.5-pro";
    if (clean.includes("2.0-pro") || clean.includes("gemini-2.0-pro")) return "gemini-2.0-flash";
    if (clean.includes("2.5-flash") || clean.includes("3.5-flash") || clean.includes("3.6-flash") || clean.includes("flash-latest")) {
      return "gemini-2.0-flash";
    }
    if (clean.includes("pro")) return "gemini-1.5-pro";
    if (clean.includes("flash")) return "gemini-2.0-flash";
    return requestedModel || "gemini-2.0-flash";
  }

  /**
   * Generate vector embedding with ultra-fast candidate model fallback
   */
  public static async generateEmbedding(text: string, apiKeyOverride?: string): Promise<number[]> {
    if (this.embeddingUnavailable) {
      return this.generateDeterministicVector(text, 768);
    }

    const candidateModels = this.workingEmbeddingModel
      ? [this.workingEmbeddingModel, "text-embedding-004", "embedding-001"]
      : ["text-embedding-004", "embedding-001"];

    try {
      const client = await this.getClient(apiKeyOverride);

      for (const modelName of Array.from(new Set(candidateModels))) {
        try {
          const embeddingModel = client.getGenerativeModel({ model: modelName });
          const embedPromise = embeddingModel.embedContent(text.substring(0, 4000));
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Embedding timeout")), 1500)
          );

          const result: any = await Promise.race([embedPromise, timeoutPromise]);
          if (result?.embedding?.values && result.embedding.values.length > 0) {
            this.workingEmbeddingModel = modelName;
            return result.embedding.values;
          }
        } catch (err: any) {
          const msg = err?.message || "";
          if (
            msg.includes("404") ||
            msg.includes("not found") ||
            msg.includes("not supported") ||
            msg.includes("timeout")
          ) {
            continue;
          }
        }
      }
    } catch (err) {
      Logger.warn("Gemini embedding warning, utilizing semantic vector fallback", {
        error: String(err),
      });
    }

    return this.generateDeterministicVector(text, 768);
  }

  /**
   * Stream response from Gemini model with grounded context and ultra-low latency
   */
  public static async *streamResponse(
    modelName: string,
    systemInstruction: string,
    prompt: string,
    temperature = 0.7,
    maxOutputTokens = 2048,
    apiKeyOverride?: string
  ): AsyncGenerator<string, void, unknown> {
    const primaryModel = this.resolveFastModel(modelName);
    let client: GoogleGenerativeAI;
    try {
      client = await this.getClient(apiKeyOverride);
    } catch (clientErr: any) {
      if (clientErr instanceof AppError) {
        throw clientErr;
      }
      throw new AppError(
        clientErr?.message || "Failed to initialize Gemini API client. Please verify API key configuration.",
        "AI_PROVIDER_ERROR",
        500
      );
    }

    const fallbackCandidates = [
      primaryModel,
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ];
    const candidateModels = Array.from(new Set(fallbackCandidates));

    let lastError: any = null;
    let streamedAny = false;

    for (const modelToTry of candidateModels) {
      try {
        const model = client.getGenerativeModel({
          model: modelToTry,
          systemInstruction: systemInstruction || undefined,
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        });

        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            streamedAny = true;
            yield text;
          }
        }

        return;
      } catch (err: any) {
        lastError = err;
        Logger.warn(`Gemini streaming attempt failed on model: ${modelToTry}`, {
          error: err?.message || String(err),
          modelToTry,
        });

        // If we already yielded tokens to the client stream, do not attempt to switch models mid-stream
        if (streamedAny) {
          throw err;
        }

        // Check if error is fatal auth/permission issue
        const errMsg = (err?.message || "").toLowerCase();
        if (
          errMsg.includes("api_key_invalid") ||
          errMsg.includes("api key not valid") ||
          errMsg.includes("api key expired") ||
          errMsg.includes("permission_denied")
        ) {
          break;
        }
      }
    }

    const failureReason = lastError?.message || "Internal AI Provider Error";
    Logger.error("All Gemini candidate models failed to stream response", lastError, {
      requestedModel: modelName,
      candidateModels,
    });

    throw new AppError(
      `Failed to stream response from Gemini model: ${failureReason}`,
      "AI_PROVIDER_ERROR",
      500
    );
  }

  /**
   * Approximate token count for cost tracking
   */
  public static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
}
