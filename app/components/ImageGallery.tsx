"use client";

import { useState } from "react";
import { ImageResult } from "@/lib/types";

type Props = {
  images: ImageResult[];
  compact?: boolean;
};

/**
 * ImageGallery component - displays images in a grid with lightbox on click
 */
export default function ImageGallery({ images, compact = false }: Props) {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const openLightbox = (image: ImageResult, index: number) => {
    setSelectedImage(image);
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const navigateNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = (selectedIndex + 1) % images.length;
    setSelectedIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
  };

  const navigatePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIndex = (selectedIndex - 1 + images.length) % images.length;
    setSelectedIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {/* Image Grid */}
      <div className={`grid gap-2 pt-1 ${compact ? "grid-cols-2" : "sm:grid-cols-2 gap-3"}`}>
        {images.map((image, index) => {
          const altText = image.title?.trim() || "صورة مقترحة من Falastin Assistant";
          return (
            <button
              key={image.id}
              onClick={() => openLightbox(image, index)}
              className={`group overflow-hidden rounded-xl border border-white/10 bg-zinc-950/40 transition hover:border-emerald-400/60 text-left cursor-zoom-in ${compact ? "rounded-lg" : "rounded-2xl"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumbnailUrl || image.imageUrl}
                alt={altText}
                className={`w-full object-cover transition duration-200 group-hover:scale-105 ${compact ? "h-24" : "h-44"}`}
                loading="lazy"
              />
              {!compact && (
                <div className="flex flex-col gap-1 px-3 py-2 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-200 line-clamp-1">
                    {image.title || "صورة مقترحة"}
                  </span>
                  <span className="line-clamp-1">
                    {image.creator ? `${image.creator} · ` : ""}
                    <span className="text-emerald-400">{image.source.toUpperCase()}</span>
                    {image.license ? ` · ${image.license}` : ""}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-100 transition hover:bg-zinc-800"
            aria-label="إغلاق"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={navigatePrev}
                className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-100 transition hover:bg-zinc-800"
                aria-label="الصورة السابقة"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={navigateNext}
                className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-100 transition hover:bg-zinc-800"
                aria-label="الصورة التالية"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Image Container */}
          <div
            className="max-w-6xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.title}
              className="w-full h-auto rounded-lg shadow-2xl"
            />

            {/* Image Info */}
            <div className="mt-4 rounded-lg bg-zinc-900/80 p-4 text-zinc-300 backdrop-blur">
              <p className="font-semibold text-lg text-zinc-100 mb-2">
                {selectedImage.title}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                {selectedImage.creator && (
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {selectedImage.creator}
                  </span>
                )}
                <span className="text-emerald-400 font-medium">
                  {selectedImage.source.toUpperCase()}
                </span>
                {selectedImage.license && (
                  <span className="text-xs bg-zinc-800 px-2 py-1 rounded">
                    {selectedImage.license}
                  </span>
                )}
              </div>
              {selectedImage.detailUrl && (
                <a
                  href={selectedImage.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-emerald-400 hover:text-emerald-300 underline"
                >
                  عرض المصدر الأصلي ←
                </a>
              )}
            </div>

            {/* Counter */}
            {images.length > 1 && (
              <div className="mt-2 text-center text-sm text-zinc-400">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
