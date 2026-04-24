import { GoogleGenAI } from "@google/genai";
import { getRelevantChunks } from "./document-grounding";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type ChatHistoryItem = {
  role: "user" | "model";
  parts: { text: string }[];
};

const SYSTEM_INSTRUCTION = `Bạn là trợ lý học tập chỉ được phép trả lời dựa trên các đoạn trích từ đúng một tài liệu nguồn do hệ thống cung cấp.

Quy tắc bắt buộc:
1. Chỉ sử dụng thông tin có trong các đoạn trích của tài liệu nguồn.
2. Không bổ sung kiến thức bên ngoài, không suy đoán, không dùng trí nhớ nền.
3. Nếu tài liệu không đủ thông tin để trả lời, phải nói rõ: "Trong tài liệu được cung cấp, mình chưa thấy thông tin đủ để trả lời câu này."
4. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, đi thẳng vào câu hỏi.
5. Khi phù hợp, nhắc ngắn rằng câu trả lời đang dựa trên giáo trình được cung cấp.
6. Nếu người dùng hỏi ngoài phạm vi tài liệu, từ chối nhẹ nhàng và nói rằng bạn chỉ được trả lời theo tài liệu này.`;

const CHAT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage =
      (error as { statusText?: string; message?: string }).message ||
      (error as { statusText?: string; message?: string }).statusText;
    if (maybeMessage) {
      return String(maybeMessage);
    }
  }

  return "Đã có lỗi xảy ra khi kết nối Gemini.";
}

function isHighDemandError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("503") ||
    normalized.includes("service unavailable") ||
    normalized.includes("unavailable") ||
    normalized.includes("high demand")
  );
}

function isApiKeyError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("api key") ||
    normalized.includes("permission") ||
    normalized.includes("unauthorized") ||
    normalized.includes("leaked") ||
    normalized.includes("permission denied") ||
    normalized.includes("403")
  );
}

function isModelError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("model") ||
    normalized.includes("not found") ||
    normalized.includes("does not exist") ||
    normalized.includes("unsupported")
  );
}

function isNetworkError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed") ||
    normalized.includes("network request failed")
  );
}

function formatHistory(history: ChatHistoryItem[]): string {
  return history
    .slice(-6)
    .map((item) => {
      const text = item.parts.map((part) => part.text).join(" ").trim();
      const label = item.role === "user" ? "Người dùng" : "Trợ lý";
      return `${label}: ${text}`;
    })
    .join("\n");
}

function buildGroundedPrompt(
  message: string,
  history: ChatHistoryItem[],
  chunks: { id: string; text: string }[],
  title: string
) {
  const excerpts = chunks
    .map((chunk, index) => `[Đoạn ${index + 1} | ${chunk.id}]\n${chunk.text}`)
    .join("\n\n");

  const historyText = formatHistory(history);

  return `Tài liệu nguồn: ${title}

Lịch sử hội thoại gần đây:
${historyText || "Không có."}

Câu hỏi hiện tại:
${message}

Các đoạn trích được phép sử dụng để trả lời:
${excerpts}

Yêu cầu trả lời:
- Chỉ trả lời dựa trên các đoạn trích bên trên.
- Nếu không đủ dữ kiện, phải nói đúng câu: "Trong tài liệu được cung cấp, mình chưa thấy thông tin đủ để trả lời câu này."
- Không dùng kiến thức ngoài tài liệu.
- Nếu có thể, nêu ngắn gọn ý chính theo gạch đầu dòng hoặc đoạn ngắn.`;
}

export const getChatResponse = async (
  message: string,
  history: ChatHistoryItem[]
): Promise<string> => {
  if (!ai) {
    return "Chưa cấu hình `VITE_GEMINI_API_KEY` trong `.env` hoặc `.env.local` nên chatbot AI chưa hoạt động.";
  }

  let lastError: unknown = null;

  try {
    const { knowledge, chunks } = await getRelevantChunks(message, 6);

    if (chunks.length === 0) {
      return "Trong tài liệu được cung cấp, mình chưa thấy thông tin đủ để trả lời câu này.";
    }

    const groundedPrompt = buildGroundedPrompt(
      message,
      history,
      chunks,
      knowledge.title
    );

    for (const model of CHAT_MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: groundedPrompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.2,
            },
          });

          const text = response.text?.trim();
          if (text) {
            return text;
          }

          return "Trong tài liệu được cung cấp, mình chưa thấy thông tin đủ để trả lời câu này.";
        } catch (error) {
          lastError = error;
          const rawMessage = getErrorMessage(error);

          console.error(
            `Error calling Gemini API (model: ${model}, attempt: ${attempt + 1}):`,
            error
          );

          if (isApiKeyError(rawMessage)) {
            return "Gemini API key hiện không dùng được. Hãy kiểm tra key còn hoạt động, đúng project, và đã bật Gemini Developer API.";
          }

          if (isHighDemandError(rawMessage)) {
            if (attempt < 2) {
              await sleep(1200 * (attempt + 1));
              continue;
            }
            break;
          }

          if (isModelError(rawMessage)) {
            break;
          }

          if (isNetworkError(rawMessage)) {
            return "Không kết nối được tới Gemini. Hãy kiểm tra mạng, tường lửa, VPN, hoặc extension đang chặn request.";
          }

          return "Xin lỗi, đã có lỗi xảy ra khi kết nối với trí tuệ nhân tạo.";
        }
      }
    }
  } catch (error) {
    console.error("Failed to load grounded document data:", error);
    return "Không đọc được dữ liệu đã trích từ PDF. Mình cần tạo lại dữ liệu tài liệu trước khi chatbot hoạt động.";
  }

  const finalMessage = getErrorMessage(lastError);

  if (isHighDemandError(finalMessage)) {
    return "Hệ thống AI đang quá tải tạm thời. Bạn thử lại sau vài giây.";
  }

  if (isApiKeyError(finalMessage)) {
    return "Gemini API key hiện không dùng được. Hãy kiểm tra key còn hoạt động, đúng project, và đã bật Gemini Developer API.";
  }

  if (isModelError(finalMessage)) {
    return "Model Gemini đang cấu hình không hợp lệ hoặc đã ngừng hỗ trợ. Mình đã tự fallback, nhưng hiện chưa có model nào trả lời được.";
  }

  if (isNetworkError(finalMessage)) {
    return "Không kết nối được tới Gemini. Hãy kiểm tra mạng, tường lửa, VPN, hoặc extension đang chặn request.";
  }

  return "Xin lỗi, đã có lỗi xảy ra khi kết nối với trí tuệ nhân tạo.";
};
