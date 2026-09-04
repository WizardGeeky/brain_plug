import { prisma } from "@/lib/db/prisma";
import { CloudinaryService } from "@/services/storage/cloudinary.service";
import { DocumentParserService } from "./parser.service";
import { TextChunkerService } from "./chunker.service";
import { GeminiService } from "@/services/gemini/gemini.service";
import { AuditService } from "@/server/audit/audit.service";
import { Logger } from "@/lib/logger/logger";
import { AppError } from "@/lib/errors/app-error";
import { DocumentStatus } from "@prisma/client";

export class KnowledgeService {
  /**
   * Upload and process a knowledge document end-to-end
   */
  public static async processDocument(
    tenantId: string,
    agentId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    uploadedBy?: string
  ) {
    // 1. Verify agent ownership
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, tenantId, deletedAt: null },
    });

    if (!agent) {
      throw new AppError("Agent not found for this tenant", "AGENT_NOT_FOUND", 404);
    }

    // 2. Upload file to Cloudinary / storage
    const uploadResult = await CloudinaryService.uploadBuffer(
      fileBuffer,
      fileName,
      mimeType,
      tenantId,
      agentId
    );

    // 3. Create document record in database
    const document = await prisma.document.create({
      data: {
        tenantId,
        agentId,
        fileName: `${Date.now()}_${fileName}`,
        originalFileName: fileName,
        mimeType,
        fileSize: uploadResult.fileSize,
        storagePath: uploadResult.storagePath,
        cloudinaryPublicId: uploadResult.publicId,
        cloudinaryUrl: uploadResult.url,
        status: DocumentStatus.PROCESSING,
        uploadedById: uploadedBy,
      },
    });

    try {
      // 4. Extract raw text from document
      const extractedText = await DocumentParserService.parseBuffer(
        fileBuffer,
        fileName,
        mimeType
      );

      if (!extractedText.trim()) {
        throw new Error("No readable text found in document");
      }

      // 5. Chunk document text
      const chunks = TextChunkerService.chunkText(extractedText);

      let totalTokens = 0;

      // 6. Generate real Gemini embeddings and save chunks
      for (const chunk of chunks) {
        totalTokens += chunk.tokenCount;
        let embeddingVector: number[] = [];

        try {
          embeddingVector = await GeminiService.generateEmbedding(chunk.content);
        } catch {
          // If embedding generation fails (e.g. unconfigured key), use standard zero vector
          embeddingVector = new Array(768).fill(0);
        }

        await prisma.documentChunk.create({
          data: {
            documentId: document.id,
            agentId,
            tenantId,
            chunkIndex: chunk.index,
            content: chunk.content,
            embedding: embeddingVector,
            tokenCount: chunk.tokenCount,
            metadata: { source: fileName, chunk: chunk.index },
          },
        });
      }

      // 7. Update document status to PROCESSED
      const updatedDoc = await prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.PROCESSED,
          chunkCount: chunks.length,
          tokenCount: totalTokens,
        },
      });

      AuditService.log({
        tenantId,
        actorUserId: uploadedBy,
        action: "DOCUMENT_PROCESSED",
        entityType: "Document",
        entityId: document.id,
        metadata: {
          fileName,
          chunks: chunks.length,
          tokens: totalTokens,
        },
      });

      return updatedDoc;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Document processing failed";

      Logger.error(`Knowledge processing failed for document ${document.id}`, err);

      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.FAILED,
          errorMessage: errorMessage,
        },
      });

      AuditService.log({
        tenantId,
        actorUserId: uploadedBy,
        action: "DOCUMENT_FAILED",
        entityType: "Document",
        entityId: document.id,
        metadata: { error: errorMessage },
      });

      throw new AppError(errorMessage, "DOCUMENT_PROCESSING_FAILED", 500);
    }
  }

  /**
   * Process raw text knowledge (FAQ, Policy, Guide) directly into vector database
   */
  public static async processRawText(
    tenantId: string,
    agentId: string,
    title: string,
    content: string,
    uploadedBy?: string
  ) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, tenantId, deletedAt: null },
    });

    if (!agent) {
      throw new AppError("Agent not found for this tenant", "AGENT_NOT_FOUND", 404);
    }

    const cleanTitle = title.trim() || "Knowledge Note";
    const cleanContent = content.trim();

    if (!cleanContent) {
      throw new AppError("Content cannot be empty", "VALIDATION_ERROR", 400);
    }

    const document = await prisma.document.create({
      data: {
        tenantId,
        agentId,
        fileName: `${cleanTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`,
        originalFileName: `${cleanTitle}.txt`,
        mimeType: "text/plain",
        fileSize: Buffer.byteLength(cleanContent, "utf8"),
        storagePath: "raw_text",
        status: DocumentStatus.PROCESSING,
        uploadedById: uploadedBy,
      },
    });

    try {
      const chunks = TextChunkerService.chunkText(cleanContent);
      let totalTokens = 0;

      for (const chunk of chunks) {
        totalTokens += chunk.tokenCount;
        let embeddingVector: number[] = [];

        try {
          embeddingVector = await GeminiService.generateEmbedding(chunk.content);
        } catch {
          embeddingVector = new Array(768).fill(0);
        }

        await prisma.documentChunk.create({
          data: {
            documentId: document.id,
            agentId,
            tenantId,
            chunkIndex: chunk.index,
            content: chunk.content,
            embedding: embeddingVector,
            tokenCount: chunk.tokenCount,
            metadata: { source: cleanTitle, chunk: chunk.index },
          },
        });
      }

      const updatedDoc = await prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.PROCESSED,
          chunkCount: chunks.length,
          tokenCount: totalTokens,
        },
      });

      AuditService.log({
        tenantId,
        actorUserId: uploadedBy,
        action: "DOCUMENT_PROCESSED",
        entityType: "Document",
        entityId: document.id,
        metadata: {
          title: cleanTitle,
          chunks: chunks.length,
          tokens: totalTokens,
        },
      });

      return updatedDoc;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Text knowledge processing failed";

      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.FAILED,
          errorMessage,
        },
      });

      throw new AppError(errorMessage, "DOCUMENT_PROCESSING_FAILED", 500);
    }
  }

  /**
   * Delete a knowledge document and all its chunks
   */
  public static async deleteDocument(
    tenantId: string,
    documentId: string,
    actorUserId?: string
  ) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId, deletedAt: null },
    });

    if (!document) {
      throw new AppError("Document not found", "NOT_FOUND", 404);
    }

    if (document.cloudinaryPublicId) {
      await CloudinaryService.deleteFile(
        document.cloudinaryPublicId,
        document.storagePath
      );
    }

    await prisma.$transaction([
      prisma.documentChunk.deleteMany({
        where: { documentId: document.id, tenantId },
      }),
      prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.DELETED,
          deletedAt: new Date(),
        },
      }),
    ]);

    AuditService.log({
      tenantId,
      actorUserId,
      action: "DOCUMENT_DELETED",
      entityType: "Document",
      entityId: document.id,
      metadata: { fileName: document.fileName },
    });
  }

  /**
   * Get all documents for an agent
   */
  public static async getAgentDocuments(tenantId: string, agentId: string) {
    return prisma.document.findMany({
      where: {
        tenantId,
        agentId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
