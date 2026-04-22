import { extractPdfText } from '../lib/extract_pdf.js';
import { getChatResponse } from '../src/lib/gemini.js';

const filePath = './GIAO TRINH KINH TE CHINH TRI MAC - LENIN (Quoc gia).pdf';

async function main() {
  console.log('Đang trích xuất nội dung PDF...');
  const text = await extractPdfText(filePath);
  console.log('Đã trích xuất xong!');

  process.stdout.write('Nhập câu hỏi: ');
  let history = [];
  process.stdin.on('data', async (input) => {
    const question = input.toString().trim();
    if (!question) return;
    // Gửi câu hỏi và nội dung PDF cho Gemini
    const answer = await getChatResponse(question + "\n\nTài liệu tham khảo:\n" + text, history);
    console.log('\nGemini trả lời:');
    console.log(answer);
    history.push({ role: 'user', parts: [{ text: question }] });
    history.push({ role: 'model', parts: [{ text: answer }] });
    process.stdout.write('\nNhập câu hỏi: ');
  });
}

main();
