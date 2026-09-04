import { NextRequest, NextResponse } from "next/server";
import { WidgetService } from "@/services/widget/widget.service";
import { apiSuccess, apiError } from "@/lib/errors/app-error";
import { getCorsHeaders, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const { agentId } = await params;
    const origin = req.headers.get("origin") || req.headers.get("referer");
    const config = await WidgetService.getPublicWidgetConfig(agentId, origin);
    
    return NextResponse.json(
      { success: true, data: config, requestId: crypto.randomUUID() },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    const errRes = apiError(err);
    Object.entries(corsHeaders).forEach(([k, v]) => {
      errRes.headers.set(k, v);
    });
    return errRes;
  }
}
