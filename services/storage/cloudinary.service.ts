import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import path from "path";
import { Logger } from "@/lib/logger/logger";

// Configure Cloudinary if credentials are provided
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId: string;
  storagePath: string;
  fileSize: number;
  format?: string;
}

export class CloudinaryService {
  private static readonly FOLDER =
    process.env.CLOUDINARY_FOLDER || "brain_plug_knowledge";

  private static isConfigured(): boolean {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Uploads a file buffer to Cloudinary (or local storage fallback if unconfigured)
   */
  public static async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    tenantId: string,
    agentId?: string
  ): Promise<UploadResult> {
    const isConfigured = this.isConfigured();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const subFolder = agentId
      ? `${this.FOLDER}/${tenantId}/${agentId}`
      : `${this.FOLDER}/${tenantId}`;

    if (isConfigured) {
      try {
        Logger.info("Uploading file to Cloudinary", {
          fileName,
          tenantId,
          agentId,
          mimeType,
        });

        const isImage = mimeType.startsWith("image/");
        const resourceType = isImage ? "image" : "raw";

        return await new Promise<UploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: subFolder,
              resource_type: resourceType,
              public_id: `${Date.now()}_${path.parse(sanitizedName).name}`,
              use_filename: true,
              unique_filename: true,
            },
            (error, result?: UploadApiResponse) => {
              if (error || !result) {
                Logger.error("Cloudinary upload stream failed", error);
                return reject(error || new Error("Upload failed"));
              }
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                storagePath: result.public_id,
                fileSize: result.bytes || buffer.length,
                format: result.format,
              });
            }
          );
          uploadStream.end(buffer);
        });
      } catch (err) {
        Logger.error("Cloudinary upload failed, falling back to local storage", err);
      }
    }

    // Local storage fallback
    const localDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      tenantId,
      agentId || "general"
    );
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    const uniqueFileName = `${Date.now()}_${sanitizedName}`;
    const filePath = path.join(localDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${tenantId}/${agentId || "general"}/${uniqueFileName}`;

    return {
      url: relativeUrl,
      publicId: `local_${tenantId}_${uniqueFileName}`,
      storagePath: filePath,
      fileSize: buffer.length,
      format: path.extname(fileName).replace(".", ""),
    };
  }

  /**
   * Delete file from Cloudinary / local storage
   */
  public static async deleteFile(
    publicId: string,
    storagePath?: string
  ): Promise<boolean> {
    try {
      if (this.isConfigured() && !publicId.startsWith("local_")) {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: "raw",
        });
        if (result.result !== "ok") {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
          });
        }
        return true;
      }

      if (storagePath && fs.existsSync(storagePath)) {
        fs.unlinkSync(storagePath);
        return true;
      }
      return true;
    } catch (err) {
      Logger.error("Error deleting file from storage", err, { publicId });
      return false;
    }
  }

  /**
   * Generate temporary/signed download URL
   */
  public static getSecureUrl(publicId: string, defaultUrl: string): string {
    if (this.isConfigured() && !publicId.startsWith("local_")) {
      return cloudinary.url(publicId, {
        secure: true,
        sign_url: true,
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      });
    }
    return defaultUrl;
  }
}
