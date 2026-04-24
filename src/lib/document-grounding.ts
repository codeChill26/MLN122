type KnowledgeChunk = {
  id: string;
  text: string;
};

type KnowledgeBase = {
  source: string;
  title: string;
  numPages: number;
  generatedAt: string;
  chunkCount: number;
  chunks: KnowledgeChunk[];
};

const KNOWLEDGE_URL = "/knowledge/giao-trinh-ktctmac-lenin.json";

let knowledgePromise: Promise<KnowledgeBase> | null = null;

const STOP_WORDS = new Set([
  "la",
  "va",
  "cua",
  "cho",
  "trong",
  "mot",
  "nhung",
  "cac",
  "khi",
  "voi",
  "ve",
  "duoc",
  "nguoi",
  "nay",
  "kia",
  "do",
  "thi",
  "co",
  "khong",
  "tai",
  "tu",
  "den",
  "theo",
  "noi",
  "chi",
  "em",
  "anh",
  "chi",
  "gi",
  "nao",
  "sao",
  "hay",
  "roi",
  "nhe",
  "minh",
  "ban",
  "toi",
]);

function normalizeVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  return normalizeVietnamese(input)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function scoreChunk(question: string, chunk: KnowledgeChunk): number {
  const normalizedQuestion = normalizeVietnamese(question);
  const questionTokens = tokenize(question);
  const chunkText = normalizeVietnamese(chunk.text);

  let score = 0;

  for (const token of questionTokens) {
    if (chunkText.includes(token)) {
      score += token.length > 5 ? 4 : 2;
    }
  }

  if (normalizedQuestion.length > 12 && chunkText.includes(normalizedQuestion)) {
    score += 20;
  }

  const bigrams = questionTokens
    .slice(0, Math.max(questionTokens.length - 1, 0))
    .map((token, index) => `${token} ${questionTokens[index + 1]}`);

  for (const bigram of bigrams) {
    if (chunkText.includes(bigram)) {
      score += 6;
    }
  }

  return score;
}

export async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  if (!knowledgePromise) {
    knowledgePromise = fetch(KNOWLEDGE_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Cannot load knowledge base: ${response.status}`);
      }
      return response.json() as Promise<KnowledgeBase>;
    });
  }

  return knowledgePromise;
}

export async function getRelevantChunks(question: string, limit = 6) {
  const knowledge = await loadKnowledgeBase();

  const ranked = knowledge.chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(question, chunk),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    knowledge,
    chunks: ranked.map(({ score: _score, ...chunk }) => chunk),
  };
}
