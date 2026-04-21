import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type ChatHistoryItem = {
  role: "user" | "model";
  parts: { text: string }[];
};

const SYSTEM_INSTRUCTION = `Bạn là một chuyên gia về Kinh tế chính trị và Triết học Mác-Lênin, đặc biệt am hiểu về chủ đề "Hội nhập kinh tế quốc tế của Việt Nam".
Nhiệm vụ của bạn là giải đáp các thắc mắc của người dùng dựa trên nội dung chính của giáo trình:

1. Khái niệm & Sự cần thiết: Là quá trình tự nguyện gắn kết kinh tế quốc gia với thế giới (tự do hóa, mở cửa thị trường, tham gia định chế). Giúp tận dụng vốn, công nghệ, quản lý, mở rộng xuất khẩu và cải cách thể chế.
2. Tính tất yếu: Do xu thế toàn cầu hóa không thể đảo ngược, sự phát triển của LLSX (CMCN 4.0) và nhu cầu giải quyết các vấn đề toàn cầu (biến đổi khí hậu, an ninh năng lượng).
3. Tác động đa chiều: 
   - Tích cực: Thúc đẩy GDP, thu hút FDI, nâng cao nhân lực, hoàn thiện thể chế.
   - Tiêu cực: Áp lực cạnh tranh lớn, rủi ro phụ thuộc, phân hóa giàu nghèo, thách thức an ninh & môi trường.
4. Phương hướng nâng cao hiệu quả: 
   - Nhận thức thực tế về thời cơ/thách thức.
   - Xây dựng chiến lược & lộ trình hội nhập toàn diện.
   - Chủ động tham gia & đóng góp xây dựng luật chơi chung.
   - Hoàn thiện thể chế & pháp luật đồng bộ.
   - Nâng cao năng lực cạnh tranh (quốc gia, doanh nghiệp, sản phẩm).
   - Xây dựng nền kinh tế độc lập, tự chủ (giữ vững định hướng, làm chủ ngành then chốt).

Hãy trả lời một cách học thuật nhưng dễ hiểu, có ví dụ thực tiễn ngắn gọn. Trả lời bằng tiếng Việt, ngắn gọn, súc tích, đi thẳng vào vấn đề. Nếu người dùng hỏi ngoài chủ đề, hãy khéo léo dẫn dắt họ quay lại nội dung hội nhập và kinh tế chính trị.`;

const CHAT_MODELS = ["gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-latest"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: any): string {
  return String(
    error?.message ||
    error?.statusText ||
    error?.toString?.() ||
    "Đã có lỗi xảy ra khi kết nối Gemini."
  );
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

export const getChatResponse = async (
  message: string,
  history: ChatHistoryItem[]
): Promise<string> => {
  if (!ai) {
    return "Chưa cấu hình VITE_GEMINI_API_KEY trong file .env.local nên chatbot AI chưa hoạt động.";
  }

  let lastError: any = null;

  for (const model of CHAT_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            ...history,
            { role: "user", parts: [{ text: message }] },
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        const text = response.text?.trim();
        if (text) {
          return text;
        }

        return "Tôi chưa tạo được phản hồi từ Gemini. Hãy thử lại.";
      } catch (error: any) {
        lastError = error;
        const rawMessage = getErrorMessage(error);
        console.error(
          `Error calling Gemini API (model: ${model}, attempt: ${attempt + 1}):`,
          error
        );

        if (isApiKeyError(rawMessage)) {
          return "Gemini API key hiện không dùng được. Bạn cần thay bằng key mới còn hoạt động trong file .env.local.";
        }

        if (isHighDemandError(rawMessage)) {
          if (attempt < 2) {
            await sleep(1200 * (attempt + 1));
            continue;
          }
          break;
        }

        return "Xin lỗi, đã có lỗi xảy ra khi kết nối với trí tuệ nhân tạo.";
      }
    }
  }

  const finalMessage = getErrorMessage(lastError);

  if (isHighDemandError(finalMessage)) {
    return "Hệ thống AI đang quá tải tạm thời. Bạn thử lại sau vài giây.";
  }

  if (isApiKeyError(finalMessage)) {
    return "Gemini API key hiện không dùng được. Bạn cần thay bằng key mới còn hoạt động trong file .env.local.";
  }

  return "Xin lỗi, đã có lỗi xảy ra khi kết nối với trí tuệ nhân tạo.";
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  if (!ai) {
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};