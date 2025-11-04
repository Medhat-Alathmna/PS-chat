"use client";
import React from "react";

const suggestions = [
  "What are the most famous Palestinian cities?",
  "ما هي أشهر المدن الفلسطينية؟",
  "How have recent events affected Jerusalem?",
  "كيف أثرت الأحداث الأخيرة على القدس؟",
  "What is the origin of the Palestinian keffiyeh?",
  "ما أصل الكوفية الفلسطينية؟",
  "What are the most popular traditional foods in Palestine?",
  "ما أشهر الأكلات الشعبية في فلسطين؟",
];

export default function IntroScreen({
  onSelect,
}: {
  onSelect: (text: string) => void;
}) {
  return (
    <div
     style={{
    backgroundImage: `
      linear-gradient(rgba(0,0,0,0.7)),
      url('../pl.jpg')
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  }}
    className="flex flex-col items-center justify-center min-h-screen text-center bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 px-6">
      <div className="flex flex-col items-center backdrop-blur" >
      <h1 className="text-6xl font-extrabold text-emerald-400 mb-3 drop-shadow-lg">
        FalastinBot
      </h1>
      <p className="text-zinc-400 mb-8 max-w-xl">
        هل لديك سؤال عن فلسطين؟ 🌿
        <span className="text-emerald-400">Palestine</span> هنا ليتحدث عن الثقافة،
        التاريخ، والمدن الفلسطينية.
      </p>
      <p className="text-zinc-400 mb-8 max-w-xl">
        Do you have a question about Palestine? 🌿
        <span className="text-emerald-400">Palestine</span> is here to talk about the culture,
        history, and cities of Palestine.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-md">
        {suggestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelect(question)}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-3 
                       text-sm sm:text-base transition hover:bg-emerald-500/20 hover:border-emerald-400 hover:text-emerald-200"
          >
            {question}
          </button>
        ))}
      </div>
</div>

    </div>
  );
}
