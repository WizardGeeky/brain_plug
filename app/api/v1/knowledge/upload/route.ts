import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { KnowledgeService } from "@/services/knowledge/knowledge.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { tenantId } = await requireTenantAccess();

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const agentId = formData.get("agentId") as string;

      if (!file) {
        return apiError(new Error("No file uploaded"));
      }

      if (!agentId) {
        return apiError(new Error("Agent ID is required"));
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const doc = await KnowledgeService.processDocument(
        tenantId,
        agentId,
        buffer,
        file.name,
        file.type || "application/octet-stream",
        user.userId
      );

      return apiSuccess(doc, undefined, 201);
    } else {
      // JSON Direct Text Knowledge Feed
      const body = await req.json();
      const { agentId, title, content } = body;

      if (!agentId) {
        return apiError(new Error("Agent ID is required"));
      }

      const doc = await KnowledgeService.processRawText(
        tenantId,
        agentId,
        title || "Knowledge Note",
        content,
        user.userId
      );

      return apiSuccess(doc, undefined, 201);
    }
  } catch (err) {
    return apiError(err);
  }
}
