import officeparser from "officeparser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = path.resolve(__dirname, "../GIAO TRINH KINH TE CHINH TRI MAC - LENIN (Quoc gia).pdf");
const outputPath = path.resolve(__dirname, "../src/data/course_content.txt");

async function extractPdf() {
  console.log("Extracting text from PDF...");
  try {
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF file not found at: ${pdfPath}`);
      process.exit(1);
    }

    const data = await officeparser.parseOfficeAsync(pdfPath);
    
    // Create output directory if not exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, data, "utf8");
    console.log(`Success! Extracted text saved to: ${outputPath}`);
    console.log(`Character count: ${data.length}`);
  } catch (error) {
    console.error("Error extracting PDF:", error);
    process.exit(1);
  }
}

extractPdf();
