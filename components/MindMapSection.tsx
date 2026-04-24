import React from "react";

export default function MindMapSection() {
  return (
    <section
      id="mindmap"
      className="relative py-20 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center border-b border-primary/10"
    >
      <h2 className="text-3xl md:text-4xl font-serif italic mb-8 text-primary text-center drop-shadow-lg">
        Mindmap: Hội nhập kinh tế quốc tế
      </h2>
      <div className="max-w-3xl w-full flex flex-col items-center">
        <img
          src="/images/Gemini_Generated_Image_s0ylm6s0ylm6s0yl.png"
          alt="Mindmap Hội nhập kinh tế quốc tế"
          className="rounded-3xl shadow-2xl border border-primary/10 w-full h-auto object-contain bg-white dark:bg-zinc-800"
          style={{ maxHeight: 480 }}
        />
        <p className="mt-4 text-muted-foreground text-center text-base">
          Sơ đồ tư duy tổng quan về các yếu tố chính của hội nhập kinh tế quốc tế.
        </p>
      </div>
    </section>
  );
}
