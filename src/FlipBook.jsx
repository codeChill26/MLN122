import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import HTMLFlipBook from "react-pageflip";

const PAGE_RATIO = 1.5;
const AUDIO_END_OFFSETS_MS = [
  0, // cover_start
  0,    // page1
  4200, // page2
  0,    // page3
  4750, // page4
  0,    // page5
  4050, // page6
  0,    // page7
  3700, // page8
  0,    // page9
  4000, // page10
  0,    // page11
  4100, // page12
  0,    // cover_end = page13.mp3
];

const DEFAULT_PAGES = [
  { src: "https://images.unsplash.com/photo-1528154032344-90d021667041?auto=format&fit=crop&w=1200&q=80", alt: "Bìa truyện: Con đường Hội nhập", type: "cover" },
  { src: "https://images.unsplash.com/photo-1555620935-77636e053a47?auto=format&fit=crop&w=1200&q=80", alt: "Khởi đầu" },
  { src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80", alt: "Sự cần thiết" },
  { src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80", alt: "Toàn cầu hóa" },
  { src: "https://images.unsplash.com/photo-1582213710300-8517c2ca0d75?auto=format&fit=crop&w=1200&q=80", alt: "Hợp đồng lịch sử" },
  { src: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=1200&q=80", alt: "Nông sản vươn xa" },
  { src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80", alt: "Hiện đại hóa sản xuất" },
  { src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80", alt: "Nâng tầm nhân lực" },
  { src: "https://images.unsplash.com/photo-1524522173746-f628baad3644?auto=format&fit=crop&w=1200&q=80", alt: "Thách thức cạnh tranh" },
  { src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80", alt: "Rủi ro phụ thuộc" },
  { src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80", alt: "Chủ động thích nghi" },
  { src: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1200&q=80", alt: "Đổi mới sáng tạo" },
  { src: "https://images.unsplash.com/photo-1444492417251-9c84a5fa1c9b?auto=format&fit=crop&w=1200&q=80", alt: "Độc lập và Tự chủ" },
  { src: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80", alt: "Bìa sau: Tương lai rộng mở", type: "cover" },
];

const DEFAULT_STORY_TEXTS = [
  "Con đường Hội nhập: Việt Nam vươn mình ra biển lớn. Câu chuyện về sự chuyển mình và gắn kết với kinh tế toàn cầu.",
  "Từ những bước đi đầu tiên, Việt Nam nhận ra rằng hội nhập không chỉ là lựa chọn, mà là tất yếu khách quan để phát triển bền vững.",
  "Để đẩy mạnh công nghiệp hóa, hiện đại hóa, chúng ta cần tận dụng nguồn lực từ thế giới: vốn, công nghệ và quản lý tiên tiến.",
  "Làn sóng toàn cầu hóa cuốn phanh mọi rào cản, thúc đẩy sự phân công lao động quốc tế mạnh mẽ hơn bao giờ hết.",
  "Gia nhập các định chế quốc tế (WTO, CPTPP...) là bước ngoặt đưa Việt Nam vào 'sân chơi chung' đầy cơ hội của nhân loại.",
  "Hàng hóa Việt Nam, từ nông sản đến điện tử, bắt đầu hành trình chinh phục những thị trường khó tính nhất toàn cầu.",
  "Các dòng vốn FDI đổ vào, mang theo những dây chuyền sản xuất tự động hóa hiện đại và tư duy quản trị mới.",
  "Môi trường quốc tế là nơi nhân lực Việt Nam rèn luyện, nâng cao trình độ và khả năng thích ứng chuyên nghiệp.",
  "Nhưng hội nhập cũng mang đến bão tố. Doanh nghiệp nội địa phải đối mặt với sức ép cạnh tranh khổng lồ từ các đối thủ lớn.",
  "Chúng ta phải tỉnh táo trước nguy cơ phụ thuộc vào biến động bên ngoài và những thách thức về an sinh, môi trường.",
  "Để vượt qua, mỗi doanh nghiệp và cá nhân cần chủ động nắm bắt luật chơi quốc tế, nâng cao năng lực cạnh tranh cốt lõi.",
  "Chuyển mình mãnh liệt từ 'gia công' sang 'sáng tạo', khẳng định bản sắc và trí tuệ Việt trên bản đồ kinh tế toàn cầu.",
  "Hội nhập nhưng giữ vững bản sắc. Xây dựng nền kinh tế độc lập, tự chủ là chìa khóa để bảo vệ chủ quyền quốc gia.",
  "Tương lai rộng mở phía trước. Với tâm thế chủ động, Việt Nam sẵn sàng chinh phục những đỉnh cao mới trong kỷ nguyên hội nhập.",
];

const DEFAULT_AUDIO_FILES = [
  "/audio/page0.mp3",
  "/audio/page1.mp3",
  "/audio/page2.mp3",
  "/audio/page3.mp3",
  "/audio/page4.mp3",
  "/audio/page5.mp3",
  "/audio/page6.mp3",
  "/audio/page7.mp3",
  "/audio/page8.mp3",
  "/audio/page9.mp3",
  "/audio/page10.mp3",
  "/audio/page11.mp3",
  "/audio/page12.mp3",
  "/audio/page13.mp3",
];

const FlipBook = React.forwardRef((props = {}, ref) => {
  const {
    audioRef: externalAudioRef,
    audioFiles: externalAudioFiles,
    setIsPlaying,
    setIsAudioAutoPlay,
  } = props;

  const flipBookRef = useRef(null);
  const containerRef = useRef(null);
  const internalAudioRef = useRef(null);
  const autoPlayTimeoutRef = useRef(null);

  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [bookSize, setBookSize] = useState({ width: 380, height: 570 });

  const pages = useMemo(() => DEFAULT_PAGES, []);
  const storyTexts = useMemo(() => DEFAULT_STORY_TEXTS, []);
  const audioFiles = useMemo(() => {
    if (Array.isArray(externalAudioFiles) && externalAudioFiles.length > 0) {
      return externalAudioFiles;
    }
    return DEFAULT_AUDIO_FILES;
  }, [externalAudioFiles]);

  const activeAudioRef = externalAudioRef?.current
    ? externalAudioRef
    : internalAudioRef;

  const clearAutoPlayTimer = () => {
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
  };

  const stopAudio = () => {
    const audio = activeAudioRef?.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying?.(false);
  };

const getFlipDelayFromAudio = (audio, pageIndex) => {
  if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
    return 2500;
  }

  const endOffset = AUDIO_END_OFFSETS_MS[pageIndex] ?? 0;
  const delay = Math.floor(audio.duration * 1000) - endOffset;

  return Math.max(delay, 100);
};

  const waitForAudioMetadata = (audio) =>
    new Promise((resolve) => {
      if (!audio) {
        resolve();
        return;
      }

      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve();
        return;
      }

      const handleLoaded = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        resolve();
      };

      const cleanup = () => {
        audio.removeEventListener("loadedmetadata", handleLoaded);
        audio.removeEventListener("canplaythrough", handleLoaded);
        audio.removeEventListener("error", handleError);
      };

      audio.addEventListener("loadedmetadata", handleLoaded, { once: true });
      audio.addEventListener("canplaythrough", handleLoaded, { once: true });
      audio.addEventListener("error", handleError, { once: true });
    });

const scheduleNextFlip = (delayMs, pageIndex) => {
  clearAutoPlayTimer();

  if (pageIndex >= pages.length - 1) return;

  autoPlayTimeoutRef.current = setTimeout(() => {
    flipBookRef.current?.pageFlip()?.flipNext();
  }, delayMs);
};

  const playAudioForPage = async (pageIndex) => {
    const audio = activeAudioRef?.current;
    const file = audioFiles?.[pageIndex];

    if (!audio || !file) {
      setIsPlaying?.(false);
      return { ok: false, delayMs: 2500 };
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = file;
      audio.load();

      await waitForAudioMetadata(audio);
      const delayMs = getFlipDelayFromAudio(audio, pageIndex);

      await audio.play();
      setIsPlaying?.(true);

      return { ok: true, delayMs };
    } catch (error) {
      console.warn("Audio play blocked or failed:", error);
      setIsPlaying?.(false);
      return { ok: false, delayMs: 2500 };
    }
  };

  const goPrev = () => flipBookRef.current?.pageFlip()?.flipPrev();
  const goNext = () => flipBookRef.current?.pageFlip()?.flipNext();
  const goStart = () => flipBookRef.current?.pageFlip()?.flip(0);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (error) {
      console.warn("Fullscreen failed:", error);
    }
  };

const startAutoPlay = async () => {
  setIsAudioAutoPlay?.(true);
  setIsAutoPlay(true);

  const pageIndex = currentPage;
  const result = await playAudioForPage(pageIndex);

  if (pageIndex < pages.length - 1) {
    scheduleNextFlip(result.delayMs, pageIndex);
  } else {
    clearAutoPlayTimer();
    autoPlayTimeoutRef.current = setTimeout(() => {
      stopAutoPlay();
    }, Math.max(result?.delayMs ?? 0, 100));
  }
};

  const stopAutoPlay = () => {
    setIsAudioAutoPlay?.(false);
    setIsAutoPlay(false);
    clearAutoPlayTimer();
    stopAudio();
  };

  useImperativeHandle(ref, () => ({
    pageFlip: () => ({
      flipNext: () => flipBookRef.current?.pageFlip()?.flipNext(),
      flipPrev: () => flipBookRef.current?.pageFlip()?.flipPrev(),
      flip: (page) => flipBookRef.current?.pageFlip()?.flip(page),
    }),
    toggleAutoPlay: async () => {
      if (isAutoPlay) {
        stopAutoPlay();
      } else {
        await startAutoPlay();
      }
    },
    startAutoPlay,
    stopAutoPlay,
    toggleFullscreen,
    getCurrentPage: () => currentPage,
    getTotalPages: () => pages.length,
    getCurrentStoryText: () => storyTexts[currentPage] || "",
  }));

  useEffect(() => {
    const updateSize = () => {
      const viewportWidth = window.innerWidth;
      const containerWidth = containerRef.current?.clientWidth || viewportWidth;

      const availableWidth = isFullscreen
        ? Math.min(viewportWidth - 120, 1100)
        : Math.min(containerWidth - 32, 980);

      const pageWidth = Math.max(
        160,
        Math.min(availableWidth / 2, isFullscreen ? 420 : 380)
      );
      const pageHeight = Math.round(pageWidth * PAGE_RATIO);

      setBookSize({ width: pageWidth, height: pageHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      clearAutoPlayTimer();
      stopAudio();
    };
  }, []);

const handleFlip = async (e) => {
  const nextPage = e?.data ?? 0;
  setCurrentPage(nextPage);

  if (!isAutoPlay) return;

  const result = await playAudioForPage(nextPage);

  if (nextPage >= pages.length - 1) {
    clearAutoPlayTimer();
    autoPlayTimeoutRef.current = setTimeout(() => {
      stopAutoPlay();
    }, Math.max(result?.delayMs ?? 0, 100));
    return;
  }

  scheduleNextFlip(result.delayMs, nextPage);
};

  const handleManualPlayCurrent = async () => {
    await playAudioForPage(currentPage);
  };

  return (
    <div
      ref={containerRef}
      className={`flipbook-shell ${isFullscreen ? "fullscreen-active" : ""}`}
    >
      {!externalAudioRef && <audio ref={internalAudioRef} preload="auto" />}

      <style>{`
        .flipbook-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 28px;
          border-radius: 32px;
          border: 1px solid rgba(37, 99, 235, 0.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.94));
          box-shadow:
            0 24px 80px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.7);
          backdrop-filter: blur(10px);
        }

        .dark .flipbook-shell {
          background:
            linear-gradient(180deg, rgba(24,24,27,0.96), rgba(9,9,11,0.96));
          border-color: rgba(59, 130, 246, 0.16);
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .flipbook-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .flipbook-kicker {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #2563eb;
        }

        .flipbook-title {
          margin: 0 0 10px;
          font-size: clamp(28px, 3.4vw, 48px);
          line-height: 1.04;
          font-weight: 700;
          font-style: italic;
          font-family: Georgia, "Times New Roman", serif;
          color: #18181b;
        }

        .dark .flipbook-title {
          color: #fafafa;
        }

        .flipbook-description {
          margin: 0;
          max-width: 760px;
          font-size: 18px;
          line-height: 1.75;
          color: #52525b;
        }

        .dark .flipbook-description {
          color: #a1a1aa;
        }

        .flipbook-meta {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .flipbook-page-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          color: #1d4ed8;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.14);
        }

        .flipbook-stage {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 640px;
          margin: 0 auto 26px;
          padding: 28px 14px;
          border-radius: 32px;
          background:
            radial-gradient(circle at top, rgba(59, 130, 246, 0.08), transparent 42%),
            linear-gradient(180deg, rgba(226, 232, 240, 0.45), rgba(241, 245, 249, 0.85));
          border: 1px solid rgba(37, 99, 235, 0.08);
          overflow: hidden;
        }

        .dark .flipbook-stage {
          background:
            radial-gradient(circle at top, rgba(59, 130, 246, 0.12), transparent 42%),
            linear-gradient(180deg, rgba(39, 39, 42, 0.75), rgba(24, 24, 27, 0.96));
          border-color: rgba(59, 130, 246, 0.14);
        }

        .dialectic-book {
          margin: 0 auto;
        }

        .page {
          background: transparent;
        }

        .page-inner {
          width: 100%;
          height: 100%;
          background: #ffffff;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
          padding: 0;
        }

        .dark .page-inner {
          background: #18181b;
        }

        .page-cover .page-inner {
          background:
            linear-gradient(180deg, rgba(254, 249, 195, 0.98), rgba(253, 230, 138, 0.98));
        }

        .page-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          object-position: center;
          background: #fff;
        }

        .page-image-page3 {
          object-fit: cover;
          object-position: center top;
          transform: scale(1.02);
        }

        .flipbook-toolbar {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .flipbook-btn {
          appearance: none;
          border: none;
          cursor: pointer;
          min-height: 46px;
          padding: 0 18px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 700;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease,
            color 0.18s ease,
            border-color 0.18s ease;
        }

        .flipbook-btn:hover {
          transform: translateY(-1px);
        }

        .flipbook-btn:active {
          transform: translateY(0);
        }

        .flipbook-btn-primary {
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
        }

        .flipbook-btn-primary:hover {
          box-shadow: 0 14px 30px rgba(37, 99, 235, 0.34);
        }

        .flipbook-btn-secondary {
          color: #1f2937;
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(37, 99, 235, 0.14);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }

        .dark .flipbook-btn-secondary {
          color: #fafafa;
          background: rgba(39,39,42,0.92);
          border-color: rgba(59, 130, 246, 0.18);
        }

        .flipbook-btn-accent {
          color: #fff;
          background: linear-gradient(135deg, #fb923c, #f97316);
          box-shadow: 0 10px 24px rgba(249, 115, 22, 0.28);
        }

        .flipbook-btn-ghost {
          color: #1d4ed8;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.14);
        }

        .dark .flipbook-btn-ghost {
          color: #93c5fd;
          background: rgba(37, 99, 235, 0.12);
        }

        .flipbook-story-card {
          padding: 20px 22px;
          border-radius: 24px;
          border: 1px solid rgba(37, 99, 235, 0.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.94));
        }

        .dark .flipbook-story-card {
          background:
            linear-gradient(180deg, rgba(24,24,27,0.9), rgba(9,9,11,0.95));
          border-color: rgba(59, 130, 246, 0.14);
        }

        .flipbook-story-label {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #2563eb;
        }

        .flipbook-story-text {
          margin: 0;
          font-size: 17px;
          line-height: 1.8;
          color: #3f3f46;
        }

        .dark .flipbook-story-text {
          color: #d4d4d8;
        }

        .fullscreen-active {
          max-width: none;
          width: 100%;
          min-height: 100vh;
          border-radius: 0;
          padding: 24px;
        }

        @media (max-width: 900px) {
          .flipbook-header {
            flex-direction: column;
            align-items: stretch;
          }

          .flipbook-meta {
            align-items: flex-start;
          }

          .flipbook-stage {
            min-height: 520px;
            padding: 18px 8px;
          }
        }

        @media (max-width: 640px) {
          .flipbook-shell {
            padding: 18px;
            border-radius: 24px;
          }

          .flipbook-title {
            font-size: 30px;
          }

          .flipbook-description {
            font-size: 16px;
          }

          .flipbook-stage {
            min-height: 420px;
            border-radius: 24px;
          }

          .flipbook-btn {
            width: 100%;
          }

          .flipbook-toolbar {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="flipbook-header">
        <div>
          <p className="flipbook-kicker">Truyện tranh tương tác</p>
          <h3 className="flipbook-title">
            Con đường Hội nhập: Việt Nam và Kinh tế toàn cầu
          </h3>
          <p className="flipbook-description">
            Lật trang để theo dõi diễn biến câu chuyện và cảm nhận các quy luật
            vận động, chuyển hóa và phát triển qua hình ảnh minh họa.
          </p>
        </div>

        <div className="flipbook-meta">
          <span className="flipbook-page-chip">
            Trang {currentPage + 1} / {pages.length}
          </span>
          <button
            type="button"
            className="flipbook-btn flipbook-btn-secondary"
            onClick={goStart}
          >
            Về đầu truyện
          </button>
        </div>
      </div>

      <div className="flipbook-stage">
        <HTMLFlipBook
          width={bookSize.width}
          height={bookSize.height}
          size="fixed"
          minWidth={160}
          maxWidth={420}
          minHeight={240}
          maxHeight={630}
          drawShadow
          usePortrait
          autoSize={false}
          mobileScrollSupport
          maxShadowOpacity={0.35}
          showCover
          showPageCorners
          flippingTime={900}
          className="dialectic-book"
          ref={flipBookRef}
          onFlip={handleFlip}
          startPage={0}
        >
          {pages.map((page, index) => (
            <div
              key={`${page.src}-${index}`}
              className={`page ${page.type === "cover" ? "page-cover" : ""}`}
            >
              <div className="page-inner">
                <img
                  src={page.src}
                  alt={page.alt}
                  className={`page-image ${page.className || ""}`}
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      <div className="flipbook-toolbar">
        <button
          type="button"
          className="flipbook-btn flipbook-btn-secondary"
          onClick={goPrev}
        >
          ← Trang trước
        </button>

        <button
          type="button"
          className="flipbook-btn flipbook-btn-ghost"
          onClick={handleManualPlayCurrent}
        >
          Phát audio trang này
        </button>

        <button
          type="button"
          className={`flipbook-btn ${
            isAutoPlay ? "flipbook-btn-accent" : "flipbook-btn-primary"
          }`}
          onClick={() => {
            if (isAutoPlay) {
              stopAutoPlay();
            } else {
              startAutoPlay();
            }
          }}
        >
          {isAutoPlay ? "Dừng tự động" : "Tự động lật + audio"}
        </button>

        <button
          type="button"
          className="flipbook-btn flipbook-btn-primary"
          onClick={goNext}
        >
          Trang sau →
        </button>

        <button
          type="button"
          className="flipbook-btn flipbook-btn-ghost"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        </button>
      </div>

      <div className="flipbook-story-card">
        <p className="flipbook-story-label">Gợi ý nội dung trang</p>
        <p className="flipbook-story-text">{storyTexts[currentPage] || ""}</p>
      </div>
    </div>
  );
});

export default FlipBook;