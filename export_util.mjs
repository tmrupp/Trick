import { writeFile } from "node:fs/promises";

// On Windows another program (an image preview, a sync client, a virus scan) can hold an
// export open for a moment, so retry a few times before failing the whole export.
export async function writeFileRetry(filePath, data, encoding) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await writeFile(filePath, data, encoding);
      return;
    } catch (error) {
      if (attempt === 5) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
}
