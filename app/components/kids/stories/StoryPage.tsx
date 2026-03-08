"use client";

interface StoryPageProps {
  text: string;
  pageNumber: number;
  totalPages?: number;
  textStyle?: { fontFamily: string; fontSize: string };
  imageUrl?: string;
}

export default function StoryPage({
  text,
  pageNumber,
  totalPages,
  textStyle,
  imageUrl,
}: StoryPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-6">
      {/* Page card */}
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
        {/* Illustration */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`صورة الصفحة ${pageNumber}`}
            className="w-full object-cover"
            style={{ maxHeight: "280px" }}
          />
        )}

        {/* Story text */}
        <div className="p-6 sm:p-8">
          <p
            className="text-white/95 text-base sm:text-lg leading-loose text-right whitespace-pre-line"
            style={{
              fontFamily: textStyle?.fontFamily || "inherit",
              fontSize: textStyle?.fontSize || undefined,
              lineHeight: "2",
            }}
            dir="rtl"
          >
            {text}
          </p>
        </div>
      </div>

      {/* Page number */}
      <div className="mt-4 text-white/50 text-sm font-medium">
        {totalPages
          ? `صفحة ${pageNumber} من ${totalPages}`
          : `صفحة ${pageNumber}`}
      </div>
    </div>
  );
}
