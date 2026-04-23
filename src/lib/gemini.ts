import * as pdfjsLib from "pdfjs-dist";

type GeminiPart = { text: string };
type GeminiRole = "user" | "model";
export type GeminiHistoryItem = { role: GeminiRole; parts: GeminiPart[] };

type DocChunk = {
  id: string;
  pageStart: number;
  pageEnd: number;
  text: string;
  textNorm: string;
};

const PDF_URL = "/images/MLN122 - Group 8.pdf";
const LS_KEY = "thbc_pdf_index_v1_mln122_group8";

let memoIndex: DocChunk[] | null = null;
let memoIndexPromise: Promise<DocChunk[]> | null = null;

function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”"']/g, "")
    .trim();
}

function splitIntoChunks(text: string, opts: { chunkSize: number; overlap: number }) {
  const { chunkSize, overlap } = opts;
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + chunkSize);
    const slice = clean.slice(i, end).trim();
    if (slice) chunks.push(slice);
    if (end >= clean.length) break;
    i = Math.max(0, end - overlap);
  }
  return chunks;
}

function scoreChunk(queryNorm: string, chunkNorm: string) {
  // scoring đơn giản: đếm số từ khóa xuất hiện (không cần embedding)
  const qWords = queryNorm.split(" ").filter(w => w.length >= 3);
  if (qWords.length === 0) return 0;

  let hit = 0;
  for (const w of qWords) {
    if (chunkNorm.includes(w)) hit++;
  }
  return hit / qWords.length;
}

async function extractPdfTextByPage(url: string) {
  // pdfjs worker
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  } catch {
    // ignore - pdfjs may auto-resolve worker depending on bundler
  }

  const loadingTask = (pdfjsLib as any).getDocument(url);
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = (content.items || [])
      .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
      .filter(Boolean);
    pages.push(strings.join(" "));
  }
  return pages;
}

async function buildIndex(): Promise<DocChunk[]> {
  const cached = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as DocChunk[];
      }
    } catch {
      // ignore
    }
  }

  const pages = await extractPdfTextByPage(PDF_URL);
  const all: DocChunk[] = [];

  pages.forEach((pageText, idx) => {
    const pageNumber = idx + 1;
    const chunks = splitIntoChunks(pageText, { chunkSize: 900, overlap: 180 });
    chunks.forEach((t, j) => {
      all.push({
        id: `p${pageNumber}_c${j + 1}`,
        pageStart: pageNumber,
        pageEnd: pageNumber,
        text: t,
        textNorm: normalize(t),
      });
    });
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(all));
    } catch {
      // ignore quota
    }
  }

  return all;
}

async function getIndex(): Promise<DocChunk[]> {
  if (memoIndex) return memoIndex;
  if (!memoIndexPromise) {
    memoIndexPromise = buildIndex()
      .then((idx) => {
        memoIndex = idx;
        return idx;
      })
      .finally(() => {
        memoIndexPromise = null;
      });
  }
  return memoIndexPromise;
}

async function buildDocContext(question: string) {
  const qNorm = normalize(question);
  if (!qNorm) return { contextText: "", used: [] as DocChunk[] };

  try {
    const index = await getIndex();
    const ranked = index
      .map((c) => ({ c, s: scoreChunk(qNorm, c.textNorm) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((x) => x.c);

    if (ranked.length === 0) return { contextText: "", used: [] as DocChunk[] };

    const contextText =
      "Trích đoạn liên quan từ tài liệu (MLN122 - Group 8):\n" +
      ranked
        .map(
          (c, i) =>
            `(${i + 1}) [trang ${c.pageStart}] ${c.text}`,
        )
        .join("\n\n");

    return { contextText, used: ranked };
  } catch {
    return { contextText: "", used: [] as DocChunk[] };
  }
}

async function callGemini(prompt:string, history:GeminiHistoryItem[]) {

  const apiKey=(import.meta as any).env?.VITE_GEMINI_API_KEY;
  if(!apiKey){
    return "Thiếu API key";
  }
 
  const models=[
    "gemini-2.5-flash",
    "gemini-2.0-flash"
  ];
  const systemInstruction = `
  Bạn là trợ lý học tập môn triết học về chủ đề Hội nhập kinh tế quốc tế của Việt Nam.
  
  Quy tắc:
  - Nếu có trích đoạn tài liệu, ưu tiên dùng tài liệu.
  - Nếu tài liệu chưa đủ, được phép bổ sung kiến thức chung.
  - Nếu dùng kiến thức ngoài tài liệu, ghi:
  "Dựa trên kiến thức ngoài tài liệu:"
  - Trả lời đầy đủ, có giải thích, có ví dụ, ưu tiên gạch đầu dòng.
  `;
  const contents=[
    { role:"user", parts:[{text:systemInstruction}]},
    ...(Array.isArray(history)?history:[]),
    { role:"user", parts:[{text:prompt}]}
  ];
 
  let lastError="";
 
  for(const model of models){
 
    const endpoint=
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
 
    try{
 
       const res=await fetch(endpoint,{
         method:"POST",
         headers:{
           "Content-Type":"application/json"
         },
         body:JSON.stringify({
           contents,
           generationConfig:{
             temperature:0.4,
             topP:0.95,
             maxOutputTokens:1000
           }
         })
       });
 
       if(res.ok){
         const data=await res.json();
 
         const text=
          data?.candidates?.[0]?.content?.parts
           ?.map((p:any)=>p?.text)
           .filter(Boolean)
           .join("") ?? "";
 
         if(text){
           return text;
         }
       }
 
       // chỉ fallback khi quota/rate limit
       if(res.status===429){
         lastError=`Model ${model} bị rate limit, thử model khác...`;
         continue;
       }
 
       // lỗi khác thì dừng
       const err=await res.text();
       return `HTTP ${res.status}: ${err}`;
 
    }catch(e:any){
       lastError=String(e);
       continue;
    }
  }
 
  return `Không gọi được AI. ${lastError}`;
 }

export async function getChatResponse(question: string, history: GeminiHistoryItem[] = []) {
  const { contextText, used } = await buildDocContext(question);
  const prompt =
    contextText
      ? `${question}\n\n${contextText}`
      : `${question}

      Nếu có nội dung trong tài liệu, ưu tiên dùng tài liệu.
      Nếu không có, hãy trả lời bằng kiến thức chung.
      Nếu dùng kiến thức ngoài tài liệu, phải ghi:
      "Dựa trên kiến thức ngoài tài liệu:"`;

  const answer = await callGemini(prompt, history);

  if (!contextText) return answer;
  if (used.length === 0) return answer;

  return `${answer}`;
}

