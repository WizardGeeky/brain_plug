import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { XMLParser } from "fast-xml-parser";
import { Logger } from "@/lib/logger/logger";
import { AppError } from "@/lib/errors/app-error";

export class DocumentParserService {
  /**
   * Extracts clean text content from supported file types
   */
  public static async parseBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    try {
      if (ext === "pdf" || mimeType.includes("pdf")) {
        return await this.parsePdf(buffer);
      }

      if (
        ext === "docx" ||
        mimeType.includes("wordprocessingml.document")
      ) {
        return await this.parseDocx(buffer);
      }

      if (
        ext === "xlsx" ||
        ext === "xls" ||
        ext === "csv" ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("csv")
      ) {
        return this.parseSpreadsheet(buffer);
      }

      if (ext === "json" || mimeType.includes("json")) {
        return this.parseJson(buffer);
      }

      if (ext === "xml" || mimeType.includes("xml")) {
        return this.parseXml(buffer);
      }

      if (
        ["txt", "md", "markdown", "log", "yaml", "yml"].includes(ext) ||
        mimeType.startsWith("text/")
      ) {
        return buffer.toString("utf-8");
      }

      // Default fallback
      return buffer.toString("utf-8");
    } catch (err) {
      Logger.error(`Error parsing document: ${fileName}`, err);
      throw new AppError(
        `Failed to extract text from document ${fileName}`,
        "DOCUMENT_PROCESSING_FAILED",
        422
      );
    }
  }

  private static async parsePdf(buffer: Buffer): Promise<string> {
    try {
      // Dynamic import to support both ESM and CommonJS
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      return data.text.replace(/\r\n/g, "\n").trim();
    } catch (err) {
      Logger.error("PDF Parse error", err);
      return buffer.toString("utf-8");
    }
  }

  private static async parseDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.replace(/\r\n/g, "\n").trim();
  }

  private static parseSpreadsheet(buffer: Buffer): Promise<string> {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    let fullText = "";

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      fullText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
    }

    return Promise.resolve(fullText.trim());
  }

  private static parseJson(buffer: Buffer): string {
    const parsed = JSON.parse(buffer.toString("utf-8"));
    return JSON.stringify(parsed, null, 2);
  }

  private static parseXml(buffer: Buffer): string {
    const parser = new XMLParser();
    const parsed = parser.parse(buffer.toString("utf-8"));
    return JSON.stringify(parsed, null, 2);
  }
}
