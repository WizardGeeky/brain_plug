import { prisma } from "@/lib/db/prisma";
import { EncryptionService } from "@/lib/encryption/encryption.service";
import { ApiKeyStatus } from "@prisma/client";

/**
 * Retrieves the raw active API key for an agent, or automatically creates and provisions
 * a default active widget API key if none currently exists.
 */
export async function getOrCreateAgentApiKey(
  tenantId: string,
  agentId: string,
  createdById?: string
): Promise<string> {
  // 1. Look for existing active API key for this agent
  let key = await prisma.apiKey.findFirst({
    where: {
      agentId,
      status: ApiKeyStatus.ACTIVE,
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. If no active key exists, auto-provision one
  if (!key) {
    // Resolve tenantId from agent if not provided
    let effectiveTenantId = tenantId;
    if (!effectiveTenantId) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { tenantId: true },
      });
      effectiveTenantId = agent?.tenantId || "";
    }

    if (!effectiveTenantId) {
      return "";
    }

    const { rawKey, keyPrefix, keyHash } = EncryptionService.generateApiKey("ak_live");
    const encryptedKey = EncryptionService.encrypt(rawKey);

    key = await prisma.apiKey.create({
      data: {
        tenantId: effectiveTenantId,
        agentId,
        name: "Default Widget Key",
        keyPrefix,
        keyHash,
        status: ApiKeyStatus.ACTIVE,
        scopes: {
          list: ["chat:write"],
          enc: encryptedKey,
        },
        createdById: createdById || null,
      },
    });

    return rawKey;
  }

  // 3. Attempt to decrypt rawKey from scopes.enc
  let rawKey: string | undefined = undefined;
  if (key.scopes && typeof key.scopes === "object") {
    const sObj = key.scopes as any;
    if (sObj.enc) {
      try {
        rawKey = EncryptionService.decrypt(sObj.enc);
      } catch (err) {
        console.error("Failed to decrypt API key:", err);
      }
    }
  }

  // 4. If legacy key without encrypted raw string, generate and persist one
  if (!rawKey) {
    const generated = EncryptionService.generateApiKey("ak_live");
    const enc = EncryptionService.encrypt(generated.rawKey);
    await prisma.apiKey.update({
      where: { id: key.id },
      data: {
        keyHash: generated.keyHash,
        keyPrefix: generated.keyPrefix,
        scopes: {
          list: Array.isArray(key.scopes) ? key.scopes : ["chat:write"],
          enc,
        },
      },
    });
    return generated.rawKey;
  }

  return rawKey;
}
