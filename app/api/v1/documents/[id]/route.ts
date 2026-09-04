import { NextRequest } from "next/server";
import { requireAuth, requireTenantAccess } from "@/server/auth/context";
import { KnowledgeService } from "@/services/knowledge/knowledge.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: documentId } = await params;
    const { tenantId } = await requireTenantAccess();

    await KnowledgeService.deleteDocument(tenantId, documentId, user.userId);
    return apiSuccess({ message: "Document deleted successfully" });
  } catch (err) {
    return apiError(err);
  }
}
