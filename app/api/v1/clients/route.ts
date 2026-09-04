import { NextRequest } from "next/server";
import { requireRole } from "@/server/auth/context";
import { ClientService } from "@/services/client/client.service";
import { createClientSchema } from "@/schemas/client.schema";
import { apiSuccess, apiError } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";

    const result = await ClientService.getClients(page, pageSize, search);
    return apiSuccess(result);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("SUPER_ADMIN");
    const body = await req.json();
    const validated = createClientSchema.parse(body);

    const result = await ClientService.createClient(validated, user.userId);
    return apiSuccess(result, undefined, 201);
  } catch (err) {
    return apiError(err);
  }
}
