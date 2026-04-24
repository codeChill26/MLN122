import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const rootDir = process.cwd();
const sourcePdfPath = path.join(
  rootDir,
  "public",
  "images",
  "GIAO TRINH KINH TE CHINH TRI MAC - LENIN (Quoc gia).pdf"
);
const outputDir = path.join(rootDir, "public", "knowledge");
const outputPath = path.join(outputDir, "giao-trinh-ktctmac-lenin.json");

function normalizeWhitespace(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "\n")
    .replace(/\n\d+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitParagraphs(text) {
  return normalizeWhitespace(text)
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter((item) => item && item.length > 20);
}

function buildChunks(paragraphs, maxLength = 1500) {
  const chunks = [];
  let current = "";
  let index = 1;

  for (const paragraph of paragraphs) {
    const nextValue = current ? `${current}\n\n${paragraph}` : paragraph;

    if (nextValue.length <= maxLength) {
      current = nextValue;
      continue;
    }

    if (current) {
      chunks.push({
        id: `chunk-${index++}`,
        text: current,
      });
      current = paragraph;
      continue;
    }

    let start = 0;
    while (start < paragraph.length) {
      const slice = paragraph.slice(start, start + maxLength);
      chunks.push({
        id: `chunk-${index++}`,
        text: slice.trim(),
      });
      start += Math.max(900, Math.floor(maxLength * 0.75));
    }
    current = "";
  }

  if (current) {
    chunks.push({
      id: `chunk-${index++}`,
      text: current,
    });
  }

  return chunks;
}

async function main() {
  if (!fs.existsSync(sourcePdfPath)) {
    throw new Error(`Missing source PDF: ${sourcePdfPath}`);
  }

  const buffer = fs.readFileSync(sourcePdfPath);
  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
  await parser.destroy();
  const totalPages = data.total ?? data.numpages ?? null;
  const paragraphs = splitParagraphs(data.text);
  const chunks = buildChunks(paragraphs);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        source: "/images/GIAO TRINH KINH TE CHINH TRI MAC - LENIN (Quoc gia).pdf",
        title: "Giáo trình Kinh tế chính trị Mác - Lênin (Quốc gia)",
        numPages: totalPages,
        generatedAt: new Date().toISOString(),
        chunkCount: chunks.length,
        chunks,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `Built knowledge file with ${chunks.length} chunks from ${totalPages ?? "unknown"} pages.`
  );
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
