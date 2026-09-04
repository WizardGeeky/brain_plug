import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { KnowledgeService } from "@/services/knowledge/knowledge.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const { tenantId } = await requireTenantAccess();

    const documents = await KnowledgeService.getAgentDocuments(tenantId, agentId);
    return apiSuccess(documents);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: agentId } = await params;
    const { tenantId } = await requireTenantAccess();

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return apiError(new Error("No file uploaded"));
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
      const { title, content } = body;

      const doc = await KnowledgeService.processRawText(
        tenantId,
        agentId,
        title || "Knowledge Text",
        content,
        user.userId
      );

      return apiSuccess(doc, undefined, 201);
    }
  } catch (err) {
    return apiError(err);
  }
}
