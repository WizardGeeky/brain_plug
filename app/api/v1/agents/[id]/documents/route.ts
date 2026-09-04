import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { KnowledgeService } from "@/services/knowledge/knowledge.service";
import { apiSuccess, apiError, AppError } from "@/lib/errors/app-error";

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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError("No file provided", "VALIDATION_ERROR", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const processedDoc = await KnowledgeService.processDocument(
      tenantId,
      agentId,
      buffer,
      file.name,
      file.type || "application/octet-stream",
      user.userId
    );

    return apiSuccess(processedDoc, undefined, 201);
  } catch (err) {
    return apiError(err);
  }
}
