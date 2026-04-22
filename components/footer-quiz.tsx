import { useMemo, useState } from "react";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AnswerKey = "A" | "B" | "C" | "D";

type QuizQuestion = {
  id: string;
  question: string;
  answers: Record<AnswerKey, string>;
  correct: AnswerKey;
  explanation: string;
};

export function FooterQuiz() {
  const questions = useMemo<QuizQuestion[]>(
    () => [
      {
        id: "q1",
        question: "Theo giáo trình, bản chất của hội nhập kinh tế quốc tế là gì?",
        answers: {
          A: "Đóng cửa nền kinh tế để ưu tiên sản xuất nội địa.",
          B: "Quá trình gắn kết nền kinh tế quốc gia với nền kinh tế thế giới dựa trên sự chia sẻ lợi ích và tuân thủ các chuẩn mực chung.",
          C: "Chỉ thực hiện giao thương hàng hóa với các nước láng giềng trong khu vực.",
          D: "Chấp nhận mọi điều kiện kinh tế của nước ngoài để thu hút vốn bằng mọi giá.",
        },
        correct: "B",
        explanation:
          "Hội nhập không chỉ là mua bán đơn thuần mà là một quá trình “gắn kết” mang tính hệ thống, yêu cầu các quốc gia tuân thủ “luật chơi chung” (chuẩn mực quốc tế) và cùng chia sẻ lợi ích.",
      },
      {
        id: "q2",
        question: "Đâu là một trong những tính tất yếu khách quan của hội nhập kinh tế quốc tế hiện nay?",
        answers: {
          A: "Do mong muốn chủ quan của các nhà quản lý.",
          B: "Do sự phát triển của các cuộc chiến tranh cục bộ.",
          C: "Do xu thế toàn cầu hóa kinh tế, nơi các yếu tố sản xuất được lưu thông trên phạm vi toàn cầu.",
          D: "Do các quốc gia muốn xóa bỏ hoàn toàn biên giới lãnh thổ.",
        },
        correct: "C",
        explanation:
          "Trong bối cảnh toàn cầu hóa, sự phụ thuộc lẫn nhau giữa các quốc gia ngày càng tăng. Các nguồn lực như vốn, công nghệ, lao động lưu thông toàn cầu khiến hội nhập trở thành xu thế khách quan khó tránh.",
      },
      {
        id: "q3",
        question:
          "Một trong những tác động tiêu cực (thách thức) của hội nhập kinh tế quốc tế đối với các nước đang phát triển là gì?",
        answers: {
          A: "Mở rộng thị trường xuất khẩu hàng hóa.",
          B: "Tiếp thu khoa học công nghệ hiện đại.",
          C: "Gia tăng sự lệ thuộc của nền kinh tế quốc gia vào thị trường bên ngoài.",
          D: "Nâng cao chất lượng nguồn nhân lực.",
        },
        correct: "C",
        explanation:
          "Bên cạnh lợi ích về vốn và thị trường, hội nhập khiến nền kinh tế trong nước dễ bị tổn thương trước biến động từ thế giới (ví dụ khủng hoảng kinh tế toàn cầu), dẫn đến nguy cơ bị lệ thuộc.",
      },
      {
        id: "q4",
        question: "Khi thực hiện hội nhập kinh tế quốc tế, Việt Nam cần tuân thủ nguyên tắc nào sau đây?",
        answers: {
          A: "Hội nhập bằng mọi giá để phát triển nhanh.",
          B: "Chỉ tham gia vào các liên kết kinh tế cấp độ thấp nhất.",
          C: "Chuẩn bị đầy đủ các điều kiện, có lộ trình và cách thức tối ưu, không hội nhập bằng mọi giá.",
          D: "Tuyệt đối không thay đổi hệ thống pháp luật trong nước.",
        },
        correct: "C",
        explanation:
          "Hội nhập cần sự chủ động và tỉnh táo: cân nhắc nội lực để xây dựng lộ trình phù hợp, tránh mở cửa ồ ạt gây đổ vỡ các ngành sản xuất trong nước.",
      },
      {
        id: "q5",
        question: "Nội dung nào sau đây là phương hướng để nâng cao hiệu quả hội nhập kinh tế của Việt Nam?",
        answers: {
          A: "Giảm bớt các cam kết quốc tế đã ký.",
          B: "Hoàn thiện thể chế kinh tế và hệ thống pháp luật.",
          C: "Hạn chế sự cạnh tranh của các doanh nghiệp nước ngoài.",
          D: "Chỉ tập trung vào xuất khẩu tài nguyên thô.",
        },
        correct: "B",
        explanation:
          "Để hội nhập thành công cần “môi trường chơi” minh bạch và tương đồng chuẩn mực quốc tế. Hoàn thiện luật pháp (đất đai, đầu tư, thuế...) vừa bảo vệ lợi ích quốc gia vừa thu hút đầu tư chất lượng.",
      },
      {
        id: "q6",
        question: "“Nền kinh tế độc lập tự chủ” trong bối cảnh hội nhập được hiểu như thế nào?",
        answers: {
          A: "Tự sản xuất tất cả mọi thứ và không mua hàng từ nước ngoài.",
          B: "Không bị lệ thuộc vào nước khác về đường lối, chính sách phát triển kinh tế.",
          C: "Đóng cửa thị trường tài chính với các ngân hàng quốc tế.",
          D: "Chỉ sử dụng nguồn vốn trong nước để đầu tư.",
        },
        correct: "B",
        explanation:
          "Độc lập tự chủ không phải “tự cung tự cấp” mà là giữ vững quyền tự quyết; không để điều kiện kinh tế/viện trợ từ bên ngoài áp đặt, khống chế làm tổn hại chủ quyền.",
      },
      {
        id: "q7",
        question: "Đâu là biện pháp quan trọng để xây dựng nền kinh tế độc lập tự chủ tại Việt Nam?",
        answers: {
          A: "Đẩy mạnh công nghiệp hóa, hiện đại hóa đất nước.",
          B: "Ngừng tham gia các tổ chức kinh tế thế giới như WTO, ASEAN.",
          C: "Chỉ tập trung phát triển nông nghiệp truyền thống.",
          D: "Tăng thuế nhập khẩu lên mức cao nhất đối với mọi loại hàng hóa.",
        },
        correct: "A",
        explanation:
          "CNH–HĐH giúp nâng cao nội lực, tạo sức mạnh vật chất và công nghệ. Khi nội lực mạnh, mới có thể “hòa nhập mà không hòa tan”, đủ sức cạnh tranh và giữ vững tự chủ.",
      },
    ],
    [],
  );

  const [selectedById, setSelectedById] = useState<Record<string, AnswerKey | undefined>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = questions.length;
  const current = questions[currentIndex];
  const selected = current ? selectedById[current.id] : undefined;
  const isCorrect = selected ? selected === current.correct : undefined;

  const sounds = useMemo(() => {
    if (typeof window === "undefined") return null;
    return {
      correct: new Audio("/audio/Am_thanh_Dung_roi_ban_gioi_qua-www_tiengdong_com.mp3"),
      wrong: new Audio("/audio/Am_thanh_ban_tra_loi_sai_roi-www_tiengdong_com.mp3"),
    };
  }, []);

  const play = (kind: "correct" | "wrong") => {
    const a = sounds?.[kind];
    if (!a) return;
    try {
      a.currentTime = 0;
      void a.play();
    } catch {
      // ignore autoplay restrictions or play failures
    }
  };

  const correctCount = questions.reduce((acc, q) => {
    const selected = selectedById[q.id];
    return acc + (selected && selected === q.correct ? 1 : 0);
  }, 0);

  const answeredCount = Object.values(selectedById).filter(Boolean).length;

  const reset = () => {
    setSelectedById({});
    setCurrentIndex(0);
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));

  return (
    <section id="review" className="w-full mt-14 scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <Card className="rounded-[2rem] border-primary/10 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl font-serif italic flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-primary" />
                  Câu hỏi trắc nghiệm
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Chọn đáp án. Đúng sẽ <span className="font-semibold text-green-600">xanh</span>, sai sẽ{" "}
                  <span className="font-semibold text-red-600">đỏ</span>. Đáp án đúng được khoanh lại và có giải thích.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  Đã trả lời: {answeredCount}/{total}
                </Badge>
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10 border-none">
                  Đúng: {correctCount}/{total}
                </Badge>
                <Button variant="outline" size="sm" className="rounded-full" onClick={reset}>
                  Làm lại
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {!current ? null : (
              <div className="grid gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      Câu {currentIndex + 1}/{total}
                    </Badge>
                    {isCorrect === true && (
                      <Badge className="rounded-full bg-green-500/10 text-green-700 hover:bg-green-500/10 border-none">
                        Đúng
                      </Badge>
                    )}
                    {isCorrect === false && (
                      <Badge className="rounded-full bg-red-500/10 text-red-700 hover:bg-red-500/10 border-none">
                        Sai
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={goPrev}
                      disabled={currentIndex === 0}
                    >
                      Câu trước
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={goNext}
                      disabled={currentIndex === total - 1}
                    >
                      Câu tiếp theo
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/5 bg-white dark:bg-zinc-950 p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <h4 className="text-base md:text-lg font-bold leading-snug">{current.question}</h4>
                    </div>
                    {isCorrect === true && <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />}
                    {isCorrect === false && <XCircle className="w-6 h-6 text-red-600 shrink-0" />}
                  </div>

                  <div className="grid gap-3">
                    {(Object.keys(current.answers) as AnswerKey[]).map((key) => {
                      const label = current.answers[key];
                      const isSelected = selected === key;
                      const isTheCorrect = key === current.correct;

                      const showState = !!selected;
                      const selectedWrong = showState && isSelected && !isTheCorrect;
                      const selectedRight = showState && isSelected && isTheCorrect;

                      return (
                        <Button
                          key={key}
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-auto justify-start text-left whitespace-normal rounded-2xl py-3 px-4 border-primary/10 bg-white dark:bg-zinc-950 hover:bg-secondary/30",
                            selectedRight && "border-green-600/50 bg-green-500/10 text-green-700 dark:text-green-400",
                            selectedWrong && "border-red-600/50 bg-red-500/10 text-red-700 dark:text-red-400",
                            showState &&
                              isTheCorrect &&
                              !isSelected &&
                              "border-green-600/30 bg-green-500/[0.06] text-foreground",
                            showState && isTheCorrect && "ring-2 ring-green-500/25 ring-offset-0",
                          )}
                          disabled={showState}
                          onClick={() => {
                            if (selected) return; // only one attempt per question
                            setSelectedById((prev) => ({ ...prev, [current.id]: key }));
                            play(isTheCorrect ? "correct" : "wrong");
                          }}
                        >
                          <span
                            className={cn(
                              "mr-3 mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold shrink-0",
                              selectedRight && "border-green-600/40 bg-green-500/10 text-green-700 dark:text-green-300",
                              selectedWrong && "border-red-600/40 bg-red-500/10 text-red-700 dark:text-red-300",
                              showState && isTheCorrect && !isSelected && "border-green-600/30 text-green-700 dark:text-green-300",
                            )}
                          >
                            {key}
                          </span>
                          <span className="text-sm md:text-[15px] leading-relaxed">{label}</span>
                        </Button>
                      );
                    })}
                  </div>

                  {selected && (
                    <>
                      <Separator className="my-4 opacity-60" />
                      <div
                        className={cn(
                          "rounded-2xl p-4 border",
                          isCorrect ? "border-green-600/20 bg-green-500/[0.06]" : "border-red-600/20 bg-red-500/[0.06]",
                        )}
                      >
                        <p className="text-sm font-bold mb-1">
                          {isCorrect ? "Chính xác" : "Chưa đúng"} — Đáp án đúng: {current.correct}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{current.explanation}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

