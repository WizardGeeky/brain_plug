export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

export class TextChunkerService {
  private static readonly DEFAULT_CHUNK_SIZE = 1500; // ~375 tokens
  private static readonly DEFAULT_OVERLAP = 200; // ~50 tokens

  /**
   * Split document text into overlapping chunks
   */
  public static chunkText(
    text: string,
    chunkSize = this.DEFAULT_CHUNK_SIZE,
    overlap = this.DEFAULT_OVERLAP
  ): TextChunk[] {
    const cleanText = text.replace(/\r\n/g, "\n").trim();
    if (!cleanText) return [];

    const chunks: TextChunk[] = [];
    const paragraphs = cleanText.split(/\n\s*\n/);

    let currentChunk = "";
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();
      if (!trimmedPara) continue;

      if ((currentChunk + "\n\n" + trimmedPara).length <= chunkSize) {
        currentChunk = currentChunk
          ? `${currentChunk}\n\n${trimmedPara}`
          : trimmedPara;
      } else {
        if (currentChunk) {
          chunks.push({
            index: chunkIndex++,
            content: currentChunk.trim(),
            tokenCount: Math.ceil(currentChunk.length / 4),
          });

          // Keep overlap from end of currentChunk
          const overlapText = currentChunk.slice(-overlap);
          currentChunk = `${overlapText}\n\n${trimmedPara}`;
        } else {
          // Paragraph itself is larger than chunkSize, split by sentences or fixed length
          const subChunks = this.splitLongString(trimmedPara, chunkSize, overlap);
          for (const sub of subChunks) {
            chunks.push({
              index: chunkIndex++,
              content: sub.trim(),
              tokenCount: Math.ceil(sub.length / 4),
            });
          }
          currentChunk = "";
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        index: chunkIndex++,
        content: currentChunk.trim(),
        tokenCount: Math.ceil(currentChunk.length / 4),
      });
    }

    return chunks;
  }

  private static splitLongString(
    str: string,
    size: number,
    overlap: number
  ): string[] {
    const result: string[] = [];
    let start = 0;

    while (start < str.length) {
      const end = Math.min(start + size, str.length);
      result.push(str.slice(start, end));
      start += size - overlap;
    }

    return result;
  }
}
